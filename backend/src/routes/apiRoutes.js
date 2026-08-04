import express from "express";
import bcrypt from "bcryptjs";
import Room from "../models/Room.js";
import livekitService from "../services/livekitService.js";

const router = express.Router();

router.post("/token", async (req, res) => {
  try {
    const { roomName, name, password, creator} = req.body;

    if (!roomName || !name) {
      return res.status(400).json({ message: "roomName and name are required" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const room = await Room.findOne({
      $or: [
        { name: roomName },
        { name: roomName.trim() },
        { name: { $regex: new RegExp(`^${roomName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } },
      ],
    }).select("+password");
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, room.password);
    if (!isPasswordValid) {
      return res.status(403).json({ message: "Incorrect password" });
    }

    const role = creator ? "INTERVIEWEE" : "INTERVIEWER";

    if (role === "INTERVIEWER") {
      const maxAllowed = room.maxInterviewers ?? 1;
      const currentCount = await livekitService.getInterviewerCount(roomName);
      if (currentCount >= maxAllowed) {
        return res.status(403).json({ message: "Room Full: Maximum number of interviewers reached." });
      }
    }

    const identity = `${name}_${Math.floor(1000 + Math.random() * 9000)}`;

    const token = await livekitService.generateToken({
      identity,
      name,
      roomName,
      role,
    });

    res.json({
      token,
      role,
    });
  } catch (error) {
    console.error("Video room token error:", error);
    res.status(500).json({ message: "Failed to generate video room token" });
  }
});

export default router;
