import roomService from "../services/RoomService.js";
import Room from "../models/Room.js";

class RoomController {
  async createRoom(req, res) {
    try {
      const { roomName, maxInterviewers, password } = req.body;

      if (!password) {
        return res.status(400).json({ message: "Meeting password is required" });
      }

      if (!maxInterviewers || maxInterviewers < 1 || maxInterviewers > 10) {
        return res.status(400).json({ message: "maxInterviewers must be between 1 and 10" });
      }

      const room = await roomService.createRoom({
        name: roomName,
        maxInterviewers,
        password,
        creator: req.user._id,
      });

      res.status(201).json({
        message: "Room created successfully",
        room,
      });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ message: "A room with that name already exists" });
      }
      console.error("Create room error:", error);
      res.status(500).json({ message: "Failed to create room" });
    }
  }

  async getRoom(req, res) {
    try {
      const room = await Room.findOne({ name: req.params.roomName });
      if (!room) {
        return res.status(404).json({ message: "Room not found" });
      }
      res.json({
        room: {
          name: room.name,
          maxInterviewers: room.maxInterviewers,
          creator: room.creator,
          createdAt: room.createdAt,
        },
      });
    } catch (error) {
      console.error("Get room error:", error);
      res.status(500).json({ message: "Failed to fetch room" });
    }
  }
}

export default new RoomController();
