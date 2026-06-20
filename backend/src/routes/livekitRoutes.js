import express from "express";
import { AccessToken } from "livekit-server-sdk";
import Room from "../models/Room.js";

const router = express.Router();

// Create a new room with allowed participants
router.post("/create-room", async (req, res) => {
  try {
    const { roomName, allowedParticipants, creator } = req.body;

    if (!roomName || !creator) {
      return res.status(400).json({
        message: "roomName and creator are required",
      });
    }

    // Check if room already exists
    let room = await Room.findOne({ name: roomName });
    if (room) {
       // Optionally update or return error. Let's allow update for now or just return it.
       room.allowedParticipants = allowedParticipants || [];
       await room.save();
    } else {
      room = new Room({
        name: roomName,
        allowedParticipants: allowedParticipants || [],
        creator: creator,
      });
      await room.save();
    }

    res.json({ message: "Room created successfully", room });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to create room",
    });
  }
});

router.post("/token", async (req, res) => {
  try {
    const { roomName, userName, email } = req.body;

    if (!roomName || !userName) {
      return res.status(400).json({
        message: "roomName and userName are required",
      });
    }

    // Validation logic
    const room = await Room.findOne({ name: roomName });
    if (!room) {
        return res.status(404).json({ message: "Room not found" });
    }

    // If it's the creator, allow.
    // If user is in allowedParticipants, allow.
    // For simplicity, let's assume email is used for validation if provided, otherwise userName.
    const isAllowed = 
        room.creator === userName || 
        room.creator === email ||
        room.allowedParticipants.includes(userName) || 
        (email && room.allowedParticipants.includes(email));

    if (!isAllowed) {
        // You might want to allow candidates to join even if not on the list, 
        // but the prompt says "only participants mentioned... can join as interviewers".
        // Let's restrict it for now as per "Strict" meeting type mentioned in frontend.
        return res.status(403).json({ message: "You are not authorized to join this room" });
    }

    const token = new AccessToken(
      process.env.LIVEKIT_API_KEY,
      process.env.LIVEKIT_API_SECRET,
      {
        identity: userName,
      }
    );

    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const jwt = await token.toJwt();

    res.json({ token: jwt });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to generate token",
    });
  }
});

export default router;