import mongoose from "mongoose";

const responseSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "InterviewQuestion",
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      default: "",
    },
    score: {
      type: Number,
      default: null,
    },
    feedback: {
      type: String,
      default: "",
    },
    answeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const interviewResultSchema = new mongoose.Schema(
  {
    roomName: {
      type: String,
      required: true,
      unique: true,
    },

    candidate: {
      type: String,
      required: true,
    },

    responses: [responseSchema],

    createdAt: {
      type: Date,
      default: Date.now,
    },
  }
);

export default mongoose.model("InterviewResult", interviewResultSchema);