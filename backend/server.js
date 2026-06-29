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
import livekitRoutes from "./src/routes/livekitRoutes.js";
import cloudinary from "./src/config/cloudinary.js";
import { GoogleGenAI } from "@google/genai";

const interviewSessions = {};

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

  // When user joins a meeting room
  socket.on("joinMeeting", (data) => {
    const { roomName, userName, email } = data;

    // Add user to room
    socket.join(roomName);

    // Track user
    if (!activeUsers.has(roomName)) {
      activeUsers.set(roomName, []);
    }
    activeUsers.get(roomName).push({ socketId: socket.id, userName, email });


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

  // When user leaves meeting
  socket.on("leaveMeeting", (data) => {
    const { roomName, userName } = data;

    if (activeUsers.has(roomName)) {
      const users = activeUsers.get(roomName);
      const index = users.findIndex(u => u.socketId === socket.id);

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
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected:", socket.id);

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
      contents: `Generate exactly 3 interview questions for a Neet Aspirant.
      Rules:
        - Return only questions
        - One question per line 
        - No numbering
        - No extra text
        `,
    });

    const text = response.text;

    const selectedQuestions = text
      .split("\n")
      .map(q => q.trim())
      .filter(q => q.length > 0)
      .slice(0, 3);

    io.emit("newQuestions", selectedQuestions);

    res.json({ questions: selectedQuestions });

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
app.get("/test-gemini", async (req, res) => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Reply with only: Gemini Connected Successfully",
    });

    res.json({
      success: true,
      message: response.text,
    });
  } catch (error) {

    res.status(500).json({
      error: error.message,
      details: error,
    });
  }
});

// Static files for uploaded content
app.use("/uploads", express.static("src/uploads"));

// Routes
app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/livekit", livekitRoutes);
app.use("/interview", interviewRoutes);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});