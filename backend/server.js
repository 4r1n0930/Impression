import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dns from 'node:dns';
import http from "http";
import { Server } from "socket.io";
import interviewRoutes from "./src/routes/interviewRoutes.js";
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import apiRoutes from "./src/routes/apiRoutes.js";
import roomRoutes from "./src/routes/roomRoutes.js";
import cloudinary from "./src/config/cloudinary.js";
import { GoogleGenAI } from "@google/genai";
import interviewController from "./src/controller/InterviewController.js";
import { createDeepgramConnection } from "./src/services/deepgramService.js";
import transcriptService from "./src/services/transcriptService.js";
import { verifyToken } from "./src/utils/auth.js";
import { primeApiKey } from "./src/services/geminiKeyService.js";

// const deepgramConnections = new Map();
const deepgramConnections = new Map();

dotenv.config();
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// Fix for some network environments
dns.setServers(['8.8.8.8', '1.1.1.1']);


// Connect to Database
await connectDB();

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.set("io", io);

// Store active users in meetings
const activeUsers = new Map(); // roomName -> [{ socketId, userName, email }]

// Verify the JWT on the handshake so that socket.userId is derived server-side.
// Without this, a client can claim any email and consume that user's Gemini key.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (!token) {
    return next(new Error("Authentication required"));
  }

  try {
    const decoded = verifyToken(token);
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;
    return next();
  } catch (err) {
    return next(new Error("Invalid or expired token"));
  }
});

io.on("connection", (socket) => {
  console.log(" User Connected:", socket.id);
  function connectDeepgram(roomName, role, userId) {
    if (deepgramConnections.has(socket.id)) {
      return deepgramConnections.get(socket.id);
    }
    const connection = createDeepgramConnection(
      socket,
      roomName,
      role,
      async ({ roomName, role, transcript, isUtteranceEnd, speechFinal }) => {

        await transcriptService.handleTranscript({
          io,
          roomName,
          role,
          transcript,
          userId: socket.userId || userId,
          isUtteranceEnd,
          speechFinal,
        });

      }
    );

    deepgramConnections.set(socket.id, connection);

    return connection;
  }
  // When user joins a meeting room
  socket.on("joinMeeting", async (data) => {
    const { roomName, userName, email, role } = data;

    // Identity comes from the verified handshake, never from client-supplied data.
    const userId = socket.userId;

    if (!userId) {
      socket.emit("error", { message: "Authentication required to join a room." });
      return;
    }

    // Warm the API key cache once so grading does not hit the DB per answer.
    await primeApiKey(userId);

    // Add user to room
    socket.join(roomName);

    // Pin room/role to the verified join. The lazy Deepgram reconnect below must
    // not trust client-supplied values from "pcm-data".
    socket.roomName = roomName;
    socket.role = role;

    // Ensure interview session exists before starting Deepgram to avoid race conditions.
    // The session is owned by the interviewee, who is the one who reads the report.
    const normalizedRole = String(role || "").toUpperCase();
    interviewController.initSession(
      roomName,
      normalizedRole === "INTERVIEWEE" ? userId : null
    );

    // Track user
    if (!activeUsers.has(roomName)) {
      activeUsers.set(roomName, []);
    }
    const roomUsers = activeUsers.get(roomName);
    const existingIdx = roomUsers.findIndex(u => u.socketId === socket.id);
    if (existingIdx !== -1) {
      roomUsers[existingIdx] = { socketId: socket.id, userName, email };
    } else {
      roomUsers.push({ socketId: socket.id, userName, email });
    }

    // Now connect to Deepgram (after session and user tracking is initialized)
    connectDeepgram(roomName, role, userId);


    // Get all users in this room
    const usersInRoom = activeUsers.get(roomName);

    // Notify all users in room that someone joined
    io.to(roomName).emit("userJoined", {
      userName,
      email,
      totalUsers: usersInRoom.length,
      users: usersInRoom,
    });

    // Send initial AI suggested questions for interviewer joining room
    if (role === "interviewer" || role === "INTERVIEWER") {
      try {
        const initialSuggestions = await interviewController.refreshSuggestions(roomName, userId);
        socket.emit("ai-suggested-questions", initialSuggestions);
      } catch (err) {
        console.error("Error generating initial AI suggestions on join:", err);
      }
    }

  });
  socket.on("interviewer:transcript", async ({ roomName, transcript }) => {
    const result =
      await interviewController.processInterviewerSpeech(roomName, transcript, socket.userId);

    if (result.type === "QUESTION") {
      io.to(roomName).emit("question:detected", result);
    }
  });
  // socket.on("answer:submit", async (data) => {
  //   try {
  //     // TODO: Integrate with EvaluationAgent once it's converted to ES modules
  //     // const result = await EvaluationAgent.process(data.question, data.answer);

  //     const result = {
  //       success: true,
  //       message: "Answer submitted successfully"
  //     };

  //     socket.emit("answer:saved", result);
  //   } catch (error) {
  //     console.error(error);

  //     socket.emit("answer:error", {
  //       success: false,
  //       message: "Unable to save answer",
  //     });
  //   }
  // });
  socket.on("pcm-data", (data) => {
    try {
      if (!data || !data.pcm) return;
      let connection = deepgramConnections.get(socket.id);

      if (!connection) {
        connection = connectDeepgram(
          socket.roomName || data.roomName,
          socket.role || data.role,
          socket.userId
        );
      }

      if (connection && typeof connection.send === "function") {
        connection.send(
          Buffer.from(new Int16Array(data.pcm).buffer)
        );
      }
    } catch (err) {
      console.error("PCM processing error:", err);
    }
  });
  socket.on("refresh-suggestions", async ({ roomName }) => {
    try {
      io.to(roomName).emit("ai-suggestions-pending", { roomName });

      const suggestions = await interviewController.refreshSuggestions(
        roomName,
        socket.userId
      );
      io.to(roomName).emit("ai-suggested-questions", suggestions);
    } catch (err) {
      console.error("Error refreshing AI suggestions:", err);
    }
  });
  // When user leaves meeting
  socket.on("leaveMeeting", async (data) => {
    const { roomName, userName } = data;

    // Grade any answer still buffered before the audio stream is torn down.
    await transcriptService.flushAllForRoom(roomName);

    if (activeUsers.has(roomName)) {
      const users = activeUsers.get(roomName);
      const index = users.findIndex(u => u.socketId === socket.id);
      const connection = deepgramConnections.get(socket.id);

      if (index > -1) {
        users.splice(index, 1);
        console.log(`${userName} left room: ${roomName}`);

        // Notify all remaining users
        io.to(roomName).emit("userLeft", {
          userName,
          totalUsers: users.length,
          users: users,
        });

        // Clean up empty rooms
        if (users.length === 0) {
          activeUsers.delete(roomName);
          console.log(` Room ${roomName} is now empty, removed from tracking`);
        } else {
          console.log(` Room ${roomName} now has ${users.length} users`);
        }

        if (connection) {
          connection.finish();
          deepgramConnections.delete(socket.id);
        }
      }
    }
  });

  socket.on("disconnect", async () => {
    console.log("User Disconnected:", socket.id);

    const connection = deepgramConnections.get(socket.id);

    // Flush any room this socket was actually in, before finishing the stream,
    // so a trailing answer is graded instead of discarded.
    const roomsToFlush = [...activeUsers.entries()]
      .filter(([, users]) => users.some((u) => u.socketId === socket.id))
      .map(([roomName]) => roomName);

    await Promise.all(
      roomsToFlush.map((roomName) => transcriptService.flushAllForRoom(roomName))
    );

    if (connection) {
      connection.finish();
      deepgramConnections.delete(socket.id);
    }

    // Remove user from all rooms on disconnect
    for (const [roomName, users] of activeUsers.entries()) {
      const index = users.findIndex(u => u.socketId === socket.id);
      if (index > -1) {
        const userName = users[index].userName;
        users.splice(index, 1);

        console.log(`${userName} disconnected from room: ${roomName}`);

        io.to(roomName).emit("userLeft", {
          userName,
          totalUsers: users.length,
          users: users,
        });

        if (users.length === 0) {
          activeUsers.delete(roomName);
        }
      }
    }
  });
});

// Middleware
app.use(cors());
app.use(express.json());
app.post("/interview/question", async (req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash",
      contents: `Generate exactly 3 interview questions for a java developer.
      Rules:
        - Return only questions
        - One question per line 
        - No numbering
        - No extra text
        `,
    });

    const text = response.text || "";
    const questions = text
      .split("\n")
      .map((q) => q.replace(/^\d+\.\s*/, "").trim())
      .filter((q) => q.length > 0);

    res.json({ questions });
  } catch (error) {
    console.error("Gemini Error:", error);

    res.status(500).json({
      message: "Failed to generate questions",
    });
  }
});
app.post("/interview/select-question", (req, res) => {
  const { question, roomName = "default" } = req.body;

  interviewController.setCurrentQuestion(roomName, question);

  res.json({
    success: true
  });
});
// Static files for uploaded content
app.use("/uploads", express.static("src/uploads"));

// Routes
app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/api", apiRoutes);
app.use("/rooms", roomRoutes);
app.use("/interview", interviewRoutes);

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err);
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);
});