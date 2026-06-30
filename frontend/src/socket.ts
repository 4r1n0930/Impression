import { io } from "socket.io-client";

export const socket = io("http://localhost:5000", {
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  reconnectionAttempts: 5,
});

// Debug listeners to show socket events in browser console
socket.on("connect", () => {
  console.log("✅ Socket Connected - ID:", socket.id);
});

socket.on("disconnect", () => {
  console.log("❌ Socket Disconnected");
});

socket.on("connect_error", (error) => {
  console.error("❌ Socket Connection Error:", error);
});

socket.on("welcome", (message) => {
  console.log("📨 Welcome Message:", message);
});
