import express from "express";
import bcrypt from "bcryptjs";
import Room from "../models/Room.js";
import livekitService from "../services/livekitService.js";
import { decrypt } from "../utils/cryptoUtils.js";
import jwt from "jsonwebtoken";

const router = express.Router();

router.post("/token", async (req, res) => {
  try {
    const { roomName, name, password, creator } = req.body;

    let authenticatedUserId = null;

    if (creator) {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      const token = authHeader.split(" ")[1];

      try {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET
        );

        authenticatedUserId = decoded.userId;
      } catch (error) {
        return res.status(401).json({
          message: "Invalid authentication token",
        });
      }
    }

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
        {
          name: {
            $regex: new RegExp(
              `^${roomName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
              "i"
            ),
          },
        },
      ],
    })
      .select("+password")
      .populate("creator");
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, room.password);
    if (!isPasswordValid) {
      return res.status(403).json({ message: "Incorrect password" });
    }

    if (creator) {
      if (!authenticatedUserId) {
        return res.status(401).json({
          message: "Authentication required",
        });
      }

      if (room.creator._id.toString() !== authenticatedUserId.toString()) {
        return res.status(403).json({
          message: "You are not the creator of this room",
        });
      }
    }

    const role = creator ? "INTERVIEWEE" : "INTERVIEWER";

    const user = room.creator;

    if (!user) {
      return res.status(404).json({
        message: "Room creator not found",
      });
    }

    const livekitUrl = user.livekitUrl || process.env.LIVEKIT_URL;

    const decryptedLivekitApiKey = user.livekitApiKey
      ? decrypt(user.livekitApiKey)
      : "";

    const decryptedLivekitApiSecret = user.livekitApiSecret
      ? decrypt(user.livekitApiSecret)
      : "";

    const livekitApiKey =
      decryptedLivekitApiKey || process.env.LIVEKIT_API_KEY;

    const livekitApiSecret =
      decryptedLivekitApiSecret || process.env.LIVEKIT_API_SECRET;

    if (role === "INTERVIEWER") {
      const maxAllowed = room.maxInterviewers ?? 1;

      const currentCount = await livekitService.getInterviewerCount({
        roomName,
        livekitUrl,
        livekitApiKey,
        livekitApiSecret,
      });
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
      livekitApiKey,
      livekitApiSecret,
    });

    res.json({
      token,
      role,
      livekitUrl,
    });
  } catch (error) {
    console.error("Video room token error:", error);
    res.status(500).json({ message: "Failed to generate video room token" });
  }
});

export default router;
