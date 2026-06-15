import express from "express";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// @route   GET /dashboard
// @desc    Redirect to frontend dashboard (UI)
// @access  Public (Frontend handles UI protection)
router.get("/go", (req, res) => {
  res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
});

// @route   GET /dashboard/data
// @desc    Access dashboard data (Protected API)
// @access  Private
router.get("/data", auth, (req, res) => {
  res.status(200).json({
    message: "Welcome to the dashboard API",
    user: req.user,
  });
});

export default router;
