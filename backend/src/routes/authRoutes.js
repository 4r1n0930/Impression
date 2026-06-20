import express from "express";
import multer from "multer";
import { OAuth2Client } from "google-auth-library";
import upload from "../middleware/upload.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import nodemailer from "nodemailer";
import cloudinary from "../config/cloudinary.js";
import fs from "fs";
import protect from "../middleware/authMiddleware.js";

import User from "../models/User.js";

const router = express.Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) => {
  return jwt.sign(
    {
      userId: user._id,
      email: user.email,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// @desc    Register a new user
// @route   POST /auth/register
router.post("/register",upload.single("profilePhoto"),
  async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    let profilePhoto = "";

    if (req.file) {
      const result = await cloudinary.uploader.upload(
      req.file.path,
      {
        folder: "profile_photos",
      }

    );
    //console.log("Image URL:", result.secure_url);

    profilePhoto = result.secure_url;

    fs.unlinkSync(req.file.path);
  }

    const user = await User.create({
    name,
    email,
    password,
    profilePhoto,
});
    const token = generateToken(user);
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
);


// @desc    Authenticate user & get token
// @route   POST /auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (user && (await user.comparePassword(password))) {
      const token = generateToken(user);

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          profilePhoto: user.profilePhoto,
          
        },
      });
    } else {
      res.status(401).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Google Login
// @route   POST /auth/google
router.post("/google", async (req, res) => {
  try {
    const { credential } = req.body;

    if (!credential) {
      return res.status(400).json({
        message: "Google credential is required",
      });
    }

    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const { sub, email, name, picture } = payload;

    // Find existing user by Google ID
    let user = await User.findOne({ googleId: sub });

    if (!user) {
      // Check if user exists with the same email (Account Linking)
      user = await User.findOne({ email });

      if (user) {
        // Link Google ID to existing account
        user.googleId = sub;
        if (!user.profilePhoto) user.profilePhoto = picture; // Update profile photo if missing
        await user.save();
      } else {
        // Create truly new user
        user = await User.create({
          googleId: sub,
          email,
          name,
          profilePhoto: picture,
        });
      }
    }

    // Generate JWT
    const token = generateToken(user);

    return res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "Authentication failed",
    });
  }
});

// @desc    Forgot Password
// @route   POST /auth/forgot-password
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

    await user.save();

    // Create reset URL
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    // Log the link (for development/hackathon without SMTP)
    console.log(`Password reset link: ${resetUrl}`);

    // Optional: Send real email if SMTP configured
    if (process.env.SMTP_HOST) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        to: user.email,
        subject: "Password Reset Request",
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n Please click on the following link, or paste this into your browser to complete the process:\n\n ${resetUrl} \n\n If you did not request this, please ignore this email and your password will remain unchanged.\n`,
      });
    }

    res.json({ message: "Reset link sent to email (check console if local)" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// @desc    Reset Password
// @route   POST /auth/reset-password/:token
router.post("/reset-password/:token", async (req, res) => {
  try {
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    // Set new password
    user.password = req.body.password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});
router.put(
  "/update-profile-photo",
  protect,
  upload.single("profilePhoto"),
  async (req, res) => {
    try {
      let profilePhoto = "";

      if (req.file) {
        const result = await cloudinary.uploader.upload(
          req.file.path,
          {
            folder: "profile_photos",
          }
        );

        profilePhoto = result.secure_url;

        fs.unlinkSync(req.file.path);
      }

      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { profilePhoto },
        { new: true }
      );

      res.json({
        message: "Profile photo updated",
        profilePhoto: user.profilePhoto,
      });
    } catch (error) {
      res.status(500).json({
        message: error.message,
      });
    }
  }
);
router.put("/update-name", protect, async (req, res) => {
  try {
    console.log("Update name route hit");
    console.log(req.body);
    console.log(req.user);
    const { name } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user.userId,
      { name },
      { new: true }
    );

    res.json({
      message: "Name updated successfully",
      name: user.name,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: error.message,
    });
  }
});

export default router;