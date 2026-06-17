import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import dns from 'node:dns';
import connectDB from "./src/config/db.js";
import authRoutes from "./src/routes/authRoutes.js";
import dashboardRoutes from "./src/routes/dashboardRoutes.js";
import livekitRoutes from "./src/routes/livekit.js";
import cloudinary from "./src/config/cloudinary.js";

dotenv.config();

// Fix for some network environments
dns.setServers(['8.8.8.8', '1.1.1.1']);

console.log("Cloudinary Connected:", cloudinary.config().cloud_name);

// Connect to Database
await connectDB(); 

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Static files for uploaded content
app.use("/uploads", express.static("src/uploads"));

// Routes
app.use("/auth", authRoutes);
app.use("/dashboard", dashboardRoutes);
app.use("/api/livekit", livekitRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
