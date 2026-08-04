import questionAgent from "../agents/QuestionAgent.js";
import evaluationAgent from "../agents/EvaluationAgent.js";
import nextQuestionAgent from "../agents/NextQuestionAgent.js";

class InterviewController {
  constructor() {
    // roomName -> current question
    this.currentQuestions = new Map();

    // roomName -> evaluations[]
    this.evaluations = new Map();

    //follow-up question limit
    this.followUpCounts = new Map();
  }

  // Interviewer ka speech aayega
  async processInterviewerSpeech(roomName, transcript) {

    const result = questionAgent.process(roomName, transcript);

    if (result.success) {
      this.currentQuestions.set(roomName, result.question);

      console.log(
        `Current Question [${roomName}]:`,
        result.question
      );

      return {
        type: "QUESTION",
        roomName,
        question: result.question,
      };
    }

    return {
      type: "IGNORE",
    };
  }

  // Interviewee ka answer aayega
  async processIntervieweeSpeech(roomName, transcript, userApiKey) {
    const question = questionAgent.getCurrentQuestion(roomName);

    if (!question) {
      return {
        error: "No active question found.",
      };
    }

    const evaluation = await evaluationAgent.process(
      question,
      transcript,
      userApiKey
    );

    const followUpCount = this.followUpCounts.get(roomName) || 0;
    if (!this.evaluations.has(roomName)) {
      this.evaluations.set(roomName, []);
    }

    this.evaluations.get(roomName).push({
      question,
      answer: transcript,
      evaluation,
    });

    const updatedFollowUpCount = followUpCount + 1;
    this.followUpCounts.set(roomName, updatedFollowUpCount);

    const nextQuestions = await nextQuestionAgent.process(
      question,
      evaluation,
      updatedFollowUpCount,
      userApiKey
    );

    return {
      evaluation,
      nextQuestions,
    };
  }

  async refreshSuggestions(roomName) {
    const history = this.evaluations.get(roomName);

    if (!history || history.length === 0) {
      return await nextQuestionAgent.process(
        null,
        null,
        0
      );
    }

    const latest = history[history.length - 1];

    const followUpCount =
      this.followUpCounts.get(roomName) || 0;

    return await nextQuestionAgent.process(
      latest.question,
      latest.evaluation,
      followUpCount
    );
  }

  // Interview khatam hone par
  getInterviewData(roomName) {
    return this.evaluations.get(roomName) || [];
  }

  // Memory cleanup
  clearInterview(roomName) {
    questionAgent.clear(roomName);
    this.currentQuestions.delete(roomName);
    this.evaluations.delete(roomName);
  }
}

export default new InterviewController();