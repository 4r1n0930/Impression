import express from "express";
import { AccessToken } from "livekit-server-sdk";

const router = express.Router();

router.post("/token", async (req, res) => {
  try {
    const { roomName, userName } = req.body;

    if (!roomName || !userName) {
      return res.status(400).json({
        message: "roomName and userName are required",
      });
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