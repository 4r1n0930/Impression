import questionAgent from "../agents/QuestionAgent.js";
import evaluationAgent from "../agents/EvaluationAgent.js";
import nextQuestionAgent from "../agents/NextQuestionAgent.js";

class InterviewController {
  constructor() {
    // roomName -> session object {
    //   currentQuestion: { text, category, evaluable } | null,
    //   evaluations: Array,
    //   followUpCount: number,
    //   userId: string | null
    // }
    this.sessions = new Map();
  }

  getSession(roomName) {
    if (!this.sessions.has(roomName)) {
      this.sessions.set(roomName, {
        currentQuestion: null,
        evaluations: [],
        followUpCount: 0,
        userId: null,
      });
    }
    return this.sessions.get(roomName);
  }

  initSession(roomName, userId = null) {
    const session = this.getSession(roomName);
    if (userId) session.userId = String(userId);
    return session;
  }

  /**
   * Only evaluable questions are stored. Non-evaluable interviewer speech
   * deliberately does NOT clear the active question, so a brief interjection
   * ("mm-hmm", "take your time") during the candidate's grace window cannot
   * wipe a question that is about to be answered.
   */
  setCurrentQuestion(roomName, question, category = "technical", evaluable = true) {
    const session = this.getSession(roomName);
    session.currentQuestion = { text: question, category, evaluable: Boolean(evaluable) };
    return session.currentQuestion;
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
  async processInterviewerSpeech(roomName, transcript, userId) {

    const result = await questionAgent.process(roomName, transcript, userId);

    if (result.success && result.isQuestion) {
      // Only a real interview question becomes the active one. Small talk and
      // logistics leave the previous question in place.
      if (result.isEvaluable) {
        this.setCurrentQuestion(
          roomName,
          result.question,
          result.category,
          true
        );
      }

      return {
        type: "QUESTION",
        roomName,
        question: result.question,
        category: result.category,
        isEvaluable: result.isEvaluable,
      };
    }

    return {
      type: "IGNORE",
      reason: result.reason || "Interviewer speech was not classified as an interview question",
    };
  }

  // Interviewee ka answer aayega -> grade it (called on the longer eval grace)
  async evaluateIntervieweeAnswer(roomName, transcript, userId) {
    const active = this.getCurrentQuestion(roomName);
    const question = active?.text ?? null;

    const session = this.getSession(roomName);

    // Gate: only grade when the active question is a real interview question.
    if (!active?.evaluable) {
      const reason = !active
        ? "no active question"
        : `active question category is "${active.category}"`;

      // Not stored: a null evaluation would be rendered by the report route as
      // a fabricated 7/10.
      return {
        evaluation: null,
        evaluationSkipped: true,
        skipReason: reason,
      };
    }

    const entry = this.upsertAnswer(session, question, transcript, active.category);

    // Re-grade the joined answers so the group reflects everything said so far.
    const evaluation = await evaluationAgent.process(
      question,
      entry.answers.join("\n\n"),
      userId,
      roomName
    );

    entry.evaluation = evaluation;
    session.followUpCount += 1;

    return {
      evaluation,
      evaluationSkipped: false,
      answerCount: entry.answers.length,
    };
  }

  // Suggestions only (called on the shorter nextq grace, before evaluation).
  async generateSuggestions(roomName, transcript, userId) {
    const active = this.getCurrentQuestion(roomName);
    const session = this.getSession(roomName);

    return await nextQuestionAgent.process(
      active?.text ?? null,
      transcript,
      session.followUpCount,
      userId,
      roomName
    );
  }

  /**
   * Canonical key for grouping repeat questions. Lowercases, strips punctuation,
   * collapses whitespace and drops conversational lead-ins so that
   * "So, explain closures?" and "explain closures" land in the same group.
   */
  questionKey(question) {
    return String(question || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .replace(/\b(so|okay|ok|now|and|alright|right|well|um|uh|great|good)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  upsertAnswer(session, question, answer, category) {
    const key = this.questionKey(question);

    let entry = session.evaluations.find((item) => item.key === key);

    if (!entry) {
      entry = {
        question,
        category,
        key,
        answers: [],
        evaluation: null,
        answerCount: 0,
      };
      session.evaluations.push(entry);
    }

    entry.answers.push(answer);
    entry.answerCount = entry.answers.length;

    return entry;
  }

  async refreshSuggestions(roomName, userId) {
    const session = this.getSession(roomName);
    const history = session.evaluations;

    if (!history || history.length === 0) {
      return await nextQuestionAgent.process(
        null,
        null,
        0,
        userId,
        roomName
      );
    }

    const latest = history[history.length - 1];

    // A manual refresh can land between the nextq and eval stages, in which case
    // the group exists but has not been graded yet. Fall back to the raw answers
    // so the prompt still receives usable context.
    const context = latest.evaluation ?? latest.answers.join("\n\n");

    return await nextQuestionAgent.process(
      latest.question,
      context,
      session.followUpCount,
      userId,
      roomName
    );
  }

  // Interview khatam hone par
  getInterviewData(roomName) {
    return this.getEvaluations(roomName);
  }

  // The userId that owns this room's report (the interviewee), or null.
  getInterviewOwner(roomName) {
    const session = this.sessions.get(roomName);
    return session?.userId || null;
  }

  // Memory cleanup
  clearInterview(roomName) {
    this.sessions.delete(roomName);
  }
}

export default new InterviewController();