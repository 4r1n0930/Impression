import questionAgent from "../agents/QuestionAgent.js";
import evaluationAgent from "../agents/EvaluationAgent.js";

class InterviewController {
  constructor() {
    this.currentQuestion = null;
    this.evaluations = [];
  }

  // Interviewer ka speech aayega
  async processInterviewerSpeech(transcript) {
    const result = await questionAgent.process(transcript);

    if (result.isQuestion) {
      this.currentQuestion = result;

      console.log("Current Question:", this.currentQuestion.question);

      return {
        type: "QUESTION",
        question: this.currentQuestion.question,
      };
    }

    return {
      type: "IGNORE",
    };
  }

  // Interviewee ka answer aayega
  async processIntervieweeSpeech(question,transcript) {
    if (!this.currentQuestion) {
      return {
        error: "No active question found.",
      };
    }

    const evaluation = await evaluationAgent.process(
      question,
      transcript
    );

    this.evaluations.push({
      question: this.currentQuestion.question,
      answer: transcript,
      evaluation,
    });

    return evaluation;
  }

  // Interview khatam hone par
  getInterviewData() {
    return this.evaluations;
  }
}

export default new InterviewController();