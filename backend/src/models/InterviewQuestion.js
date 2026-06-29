  import mongoose from "mongoose";

  const interviewQuestionSchema = new mongoose.Schema({
    roomName: {
      type: String,
      required: true,
    },
    question: {
      type: String,
      required: true,
    },
    answer: {
      type: String,
      default: "",     // Abhi empty rahega
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  });

  export default mongoose.model(
    "InterviewQuestion",
    interviewQuestionSchema
  );