import mongoose from "mongoose";

const interviewResultSchema = new mongoose.Schema({
  questionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "InterviewQuestion",
    required: true,
  },

  candidate: String,
  roomName: String,
  question: String,
  answer: String,
  score: Number,
  feedback: String,

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.model(
  "InterviewResult",
  interviewResultSchema
);