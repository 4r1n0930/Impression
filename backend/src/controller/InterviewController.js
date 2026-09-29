import questionAgent from "../agents/QuestionAgent.js";
import evaluationAgent from "../agents/EvaluationAgent.js";
import nextQuestionAgent from "../agents/NextQuestionAgent.js";

class InterviewController {
  constructor() {
    // roomName -> session object { currentQuestion: string|null, evaluations: Array, followUpCount: number }
    this.sessions = new Map();
  }

  getSession(roomName) {
    if (!this.sessions.has(roomName)) {
      this.sessions.set(roomName, {
        currentQuestion: null,
        evaluations: [],
        followUpCount: 0,
      });
    }
    return this.sessions.get(roomName);
  }

  initSession(roomName) {
    return this.getSession(roomName);
  }

  setCurrentQuestion(roomName, question) {
    const session = this.getSession(roomName);
    session.currentQuestion = question;
  }

  getCurrentQuestion(roomName) {
    const session = this.getSession(roomName);
    return session.currentQuestion;
  }

  getEvaluations(roomName) {
    const session = this.getSession(roomName);
    return session.evaluations;
  }

  // Interviewer ka speech aayega
  async processInterviewerSpeech(roomName, transcript, userApiKey) {

    const result = await questionAgent.process(roomName, transcript, userApiKey);

    if (result.success && result.isQuestion) {
      this.setCurrentQuestion(roomName, result.question);

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
      reason: result.reason || "Interviewer speech was not classified as an interview question",
    };
  }

  // Interviewee ka answer aayega
  async processIntervieweeSpeech(roomName, transcript, userApiKey) {
    const question = this.getCurrentQuestion(roomName);

    if (!question) {
      return {
        error: "No active question found.",
      };
    }

    const session = this.getSession(roomName);
    const updatedFollowUpCount = session.followUpCount + 1;

    // Parallelize evaluation and next question generation using Promise.all()
    // Cuts UI latency from sequential waterfall (~5-6s) down to ~2.5s
    const [evaluation, nextQuestions] = await Promise.all([
      evaluationAgent.process(question, transcript, userApiKey),
      nextQuestionAgent.process(question, transcript, updatedFollowUpCount, userApiKey),
    ]);

    session.evaluations.push({
      question,
      answer: transcript,
      evaluation,
    });
    session.followUpCount = updatedFollowUpCount;

    return {
      evaluation,
      nextQuestions,
    };
  }

  async refreshSuggestions(roomName, userApiKey) {
    const session = this.getSession(roomName);
    const history = session.evaluations;

    if (!history || history.length === 0) {
      return await nextQuestionAgent.process(
        null,
        null,
        0,
        userApiKey
      );
    }

    const latest = history[history.length - 1];

    return await nextQuestionAgent.process(
      latest.question,
      latest.evaluation,
      session.followUpCount,
      userApiKey
    );
  }

  // Interview khatam hone par
  getInterviewData(roomName) {
    return this.getEvaluations(roomName);
  }

  // Memory cleanup
  clearInterview(roomName) {
    this.sessions.delete(roomName);
  }
}

export default new InterviewController();