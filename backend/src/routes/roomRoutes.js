import express from "express";
import { auth } from "../middleware/auth.js";
import roomController from "../controller/RoomController.js";

const router = express.Router();

router.post("/", auth, roomController.createRoom);
router.get("/:roomName", roomController.getRoom);

export default router;
