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
import nextQuestionAgent from "./src/agents/NextQuestionAgent.js";
import User from "./src/models/User.js";
import { decrypt } from "./src/utils/cryptoUtils.js";

const interviewSessions = new Map();
const deepgramConnections = new Map();

const answerBuffers = new Map();
const answerTimers = new Map();

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

io.on("connection", (socket) => {
  console.log(" User Connected:", socket.id);
  function connectDeepgram(roomName, role, userApiKey) {
    if (deepgramConnections.has(socket.id)) {
      return deepgramConnections.get(socket.id);
    }
    const connection = createDeepgramConnection(
      socket,
      roomName,
      role,
      async ({ roomName, role, transcript }) => {

        await transcriptService.handleTranscript({
          io,
          roomName,
          role,
          transcript,
          userApiKey: socket.userApiKey || userApiKey,
        });

      }
    );

    deepgramConnections.set(socket.id, connection);

    return connection;
  }
  // When user joins a meeting room
  socket.on("joinMeeting", async (data) => {
    const { roomName, userName, email, role, geminiApiKey } = data;

    let userApiKey = geminiApiKey ? decrypt(geminiApiKey) : "";
    if (!userApiKey && email) {
      try {
        const u = await User.findOne({ email });
        if (u && u.geminiApiKey) {
          userApiKey = decrypt(u.geminiApiKey);
        }
      } catch (e) {
        console.error("Error fetching user geminiApiKey:", e);
      }
    }
    socket.userApiKey = userApiKey;

    // Add user to room
    socket.join(roomName);

    // Ensure interview session exists before starting Deepgram to avoid race conditions
    if (!interviewSessions.has(roomName)) {
      interviewSessions.set(roomName, {
        currentQuestion: null,
        evaluations: []
      });
    }

    // Track user
    if (!activeUsers.has(roomName)) {
      activeUsers.set(roomName, []);
    }
    const roomUsers = activeUsers.get(roomName);
    const existingIdx = roomUsers.findIndex(u => u.socketId === socket.id);
    if (existingIdx !== -1) {
      roomUsers[existingIdx] = { socketId: socket.id, userName, email, geminiApiKey: userApiKey };
    } else {
      roomUsers.push({ socketId: socket.id, userName, email, geminiApiKey: userApiKey });
    }

    // Now connect to Deepgram (after session and user tracking is initialized)
    connectDeepgram(roomName, role, userApiKey);


    // Get all users in this room
    const usersInRoom = activeUsers.get(roomName);

    // Notify all users in room that someone joined
    io.to(roomName).emit("userJoined", {
      userName,
      email,
      totalUsers: usersInRoom.length,
      users: usersInRoom,
    });

  });
  socket.on("interviewer:transcript", async ({ roomName, transcript }) => {
    const result =
      await interviewController.processInterviewerSpeech(transcript);

    if (result.type === "QUESTION") {

      interviewSessions.get(roomName).currentQuestion = result.question;

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
    let connection = deepgramConnections.get(socket.id);

    if (!connection) {
      connection = connectDeepgram(data.roomName, data.role);
    }

    connection.send(
      Buffer.from(new Int16Array(data.pcm).buffer)
    );
  });
  socket.on("refresh-suggestions", ({ roomName }) => {
    socket.emit("ai-suggested-questions", [
      "Explain TreeMap.",
      "What is LinkedHashMap?",
      "How does HashMap handle collisions?"
    ]);
  });
  // When user leaves meeting
  socket.on("leaveMeeting", (data) => {
    const { roomName, userName } = data;

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

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);

    const connection = deepgramConnections.get(socket.id);

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
      model: "gemini-2.5-flash",
      contents: `Generate exactly 3 interview questions for a java developer.
      Rules:
        - Return only questions
        - One question per line 
        - No numbering
        - No extra text
        `,
    });
  } catch (error) {
    console.error("Gemini Error:", error);

    res.status(500).json({
      message: "Failed to generate questions",
    });
  }
});
app.post("/interview/select-question", (req, res) => {
  const { question } = req.body;

  if (!interviewSessions["default"]) {
    interviewSessions["default"] = {
      qaPairs: []
    };
  }

  interviewSessions["default"].qaPairs.push({
    question,
    answer: ""
  });

  console.log(
    JSON.stringify(interviewSessions, null, 2)
  );

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

const PORT = process.env.PORT || 5000;
server.listen(PORT, async () => {
  console.log(`Server running on port ${PORT}`);

});