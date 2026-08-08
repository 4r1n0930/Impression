import express from "express";
import { GoogleGenAI } from "@google/genai";
import InterviewQuestion from "../models/InterviewQuestion.js";
import interviewController from "../controller/InterviewController.js";
import feedbackAgent from "../agents/FeedbackAgent.js";

const router = express.Router();

router.get("/feedback/:roomName", async (req, res) => {
  try {
    const { roomName } = req.params;
    const userApiKey = req.query.apiKey || "";

    // 1. Retrieve live in-memory evaluations stored in InterviewController
    const liveEvaluations = interviewController.getInterviewData(roomName);

    // 2. Generate overall assessment using FeedbackAgent
    const overallFeedback = await feedbackAgent.process(liveEvaluations, userApiKey);

    // 3. Format question-wise evaluation items for the frontend
    const questions = liveEvaluations.map((item, idx) => {
      const ev = item.evaluation || {};
      return {
        id: idx + 1,
        question: item.question || `Question ${idx + 1}`,
        answer: item.answer || "No candidate answer recorded.",
        score: ev.score ?? 7,
        technicalAccuracy: ev.technicalAccuracy ?? 7,
        completeness: ev.completeness ?? 7,
        communicationClarity: (ev.communication || ev.communicationClarity) ?? 7,
        confidence: ev.confidence ?? 7,
        strengths: ev.strengths && ev.strengths.length > 0 ? ev.strengths : ["Demonstrated technical understanding"],
        weaknesses: ev.weaknesses && ev.weaknesses.length > 0 ? ev.weaknesses : ["Could elaborate further with specific code examples"],
        missingConcepts: ev.missingConcepts || []
      };
    });

    res.json({
      success: true,
      hasLiveData: liveEvaluations.length > 0,
      roomName,
      interviewDate: new Date().toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      durationMinutes: Math.max(5, questions.length * 8),
      overallScore: overallFeedback.overallScore,
      verdict: overallFeedback.verdict,
      metrics: overallFeedback.metrics,
      summary: overallFeedback.summary,
      questions
    });

  } catch (error) {
    console.error("Error generating interview feedback:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate interview feedback report"
    });
  }
});

router.post("/question/room", async (req, res) => {
  try {
    const io = req.app.get("io");
    const { roomName } = req.body;

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: `Generate 3 relevant technical interview questions for an interview candidate.
      Rules:
      - Return only questions
      - One question per line
      - No numbering or markdown bullets
      `
    });

    const text = response.text || "";

    const questions = text
      .split("\n")
      .map((q) => q.replace(/^\d+\.\s*/, "").trim())
      .filter((q) => q.length > 0);

    if (roomName && io) {
      io.to(roomName).emit("newQuestions", questions);
    }

    res.json({
      questions,
    });
  } catch (error) {
    console.error("Error generating room questions:", error);
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