import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Room from "../models/Room.js";

class RoomService {
  async createRoom({ name, maxInterviewers, password, creator }) {
    const roomName = name && name.trim()
      ? name.trim()
      : `Interview Room #${new mongoose.Types.ObjectId()}`;

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const room = await Room.create({
      name: roomName,
      maxInterviewers: maxInterviewers ?? 1,
      password: hashedPassword,
      creator,
    });

    return room;
  }
}

export default new RoomService();
