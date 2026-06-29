import express from "express";
import { GoogleGenAI } from "@google/genai";
import InterviewQuestion from "../models/InterviewQuestion.js";
const router = express.Router();

router.post("/question/room", async (req, res) => {
  try {
    const io = req.app.get("io");
    const { roomName } = req.body;

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    
    console.log(response.text);
    return res.json({
      questions: response.text,
    });

    const text = response.text;

    const questions = text
      .split("\n")
      .map((q) => q.replace(/^\d+\.\s*/, "").trim())
      .filter((q) => q.length > 0);

    io.to(roomName).emit("newQuestions", questions);

    res.json({
      questions,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: error.message,
    });
  }
});
router.post("/save-question", async (req, res) => {
  try {
    const { roomName, question } = req.body;

    const newQuestion = await InterviewQuestion.create({
      roomName,
      question,
      answer: "",   // Abhi empty save hoga
    });

    res.status(201).json({
      success: true,
      questionId: newQuestion._id,
      question: newQuestion.question,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Failed to save question",
    });
  }
});
router.post("/save-answer", async (req, res) => {
  try {
    console.log(req.body);
    const { roomName, question, answer, userName } = req.body;

    const interview = await InterviewQuestion.findOne({
      roomName,
      question,
    });

    if (!interview) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    interview.answer = answer;
    await interview.save();

    res.json({
      success: true,
      message: "Answer saved successfully",
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to save answer",
    });
  }
});

export default router;