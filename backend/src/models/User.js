import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
    },
    name: String,
    email: String,
    avatar: String,
  },
  { timestamps: true }
);

export default mongoose.model(
  "User",
  userSchema
);