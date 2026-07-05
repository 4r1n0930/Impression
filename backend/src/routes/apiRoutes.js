import express from "express";
import bcrypt from "bcryptjs";
import Room from "../models/Room.js";
import livekitService from "../services/livekitService.js";

const router = express.Router();

router.post("/token", async (req, res) => {
  try {
    const { roomName, name, password, creator } = req.body;

    if (!roomName || !name) {
      return res.status(400).json({ message: "roomName and name are required" });
    }

    if (!password) {
      return res.status(400).json({ message: "Password is required" });
    }

    const room = await Room.findOne({ name: roomName }).select("+password");
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, room.password);
    if (!isPasswordValid) {
      return res.status(403).json({ message: "Incorrect password" });
    }

    const identity = creator
      ? "interviewee"
      : `interviewer-${name}-${Math.random().toString(36).slice(2, 6)}`;

    const role = creator ? "INTERVIEWEE" : "INTERVIEWER";

    const token = await livekitService.generateToken({
      identity,
      name,
      roomName,
    });

    res.json({ token, role });
  } catch (error) {
    console.error("Token error:", error);
    res.status(500).json({ message: "Failed to generate token" });
  }
});

export default router;
