import interviewController from "../controller/InterviewController.js";
import { agentLog } from "../utils/agentLogger.js";

const NEXTQ = "nextq";
const EVAL = "eval";

class TranscriptService {

  constructor() {
    this.buffers = new Map();
    // key -> { [stage]: timeoutId }
    this.timers = new Map();
    // key -> { [stage]: { grace, callback } }
    this.pending = new Map();
  }

  // Suggestions are advisory, so they are produced on the shorter grace window.
  get GRACE_DELAY() {
    return { interviewer: 1200, interviewee: 3500 };
  }

  // Grading is the expensive call, so it waits for a longer settled pause.
  get EVAL_DELAY() {
    return { interviewer: 1200, interviewee: 5000 };
  }

  // Backstop used only when no silence signal has arrived at all.
  get SAFETY_DELAY() {
    return { interviewer: 4000, interviewee: 15000 };
  }

  roleForKey(key) {
    return key.endsWith("-interviewer") ? "interviewer" : "interviewee";
  }

  stageDelay(key, stage) {
    const role = this.roleForKey(key);
    return stage === EVAL ? this.EVAL_DELAY[role] : this.GRACE_DELAY[role];
  }

  clearKey(key) {
    const timersForKey = this.timers.get(key);
    if (timersForKey) {
      Object.values(timersForKey).forEach((id) => clearTimeout(id));
    }
    this.timers.delete(key);
    this.pending.delete(key);
  }

  scheduleStage(key, stage, callback, sawSilenceSignal) {
    const timersForKey = this.timers.get(key) || {};
    if (timersForKey[stage]) {
      clearTimeout(timersForKey[stage]);
    }

    const pendingForKey = this.pending.get(key) || {};
    // Sticky: once silence has been signalled for this stage, later chunks keep
    // re-arming the grace window instead of reverting to the long backstop.
    const wasGrace = pendingForKey[stage]?.grace === true;
    const useGrace = Boolean(sawSilenceSignal) || wasGrace;
    pendingForKey[stage] = { grace: useGrace, callback };
    this.pending.set(key, pendingForKey);

    const role = this.roleForKey(key);
    const delay = useGrace ? this.stageDelay(key, stage) : this.SAFETY_DELAY[role];

    timersForKey[stage] = setTimeout(() => {
      this.runStage(key, stage);
    }, delay);
    this.timers.set(key, timersForKey);
  }

  /**
   * The interviewee runs two independently timed stages per silence episode:
   *   nextq - short grace, peeks at the buffer and leaves it intact
   *   eval  - longer grace, consumes the buffer and grades it
   * The interviewer only needs the eval stage.
   */
  armStages(key, sawSilenceSignal, evalCallback, nextqCallback) {
    if (this.roleForKey(key) === "interviewer") {
      this.scheduleStage(key, EVAL, evalCallback, sawSilenceSignal);
      return;
    }

    this.scheduleStage(key, NEXTQ, nextqCallback, sawSilenceSignal);
    this.scheduleStage(key, EVAL, evalCallback, sawSilenceSignal);
  }

  runStage(key, stage) {
    const pendingForKey = this.pending.get(key) || {};
    const entry = pendingForKey[stage];

    if (!entry || typeof entry.callback !== "function") {
      this.clearKey(key);
      return Promise.resolve();
    }

    const timersForKey = this.timers.get(key) || {};
    if (timersForKey[stage]) {
      clearTimeout(timersForKey[stage]);
      delete timersForKey[stage];
      this.timers.set(key, timersForKey);
    }

    delete pendingForKey[stage];
    this.pending.set(key, pendingForKey);

    if (stage === EVAL) {
      // Consuming stage: closes the episode and always clears the buffer, even
      // when the answer turns out not to be worth grading.
      return this.flushBuffer(key, entry.callback);
    }

    // Advisory stage: peek without consuming, so evaluation still gets the text.
    const peeked = (this.buffers.get(key) || "").trim();
    if (peeked.length === 0) {
      return Promise.resolve();
    }

    agentLog(
      "PIPELINE",
      key.replace(/-interviewer$|-interviewee$/, ""),
      `${NEXTQ} stage · ${peeked.length} chars`
    );

    return entry.callback(peeked);
  }

  flushBuffer(key, callback) {
    this.clearKey(key);

    const finalTranscript = (this.buffers.get(key) || "").trim();
    this.buffers.delete(key);

    agentLog(
      "PIPELINE",
      key.replace(/-interviewer$|-interviewee$/, ""),
      `${this.roleForKey(key)} utterance flushed · ${finalTranscript.length} chars`,
      finalTranscript
    );

    if (finalTranscript.length > 0) {
      return callback(finalTranscript);
    }

    return Promise.resolve();
  }

  /**
   * Grades any answer still buffered for a room. Called when a participant
   * leaves, so the final answer is graded instead of being silently discarded.
   * Only the eval stage runs; there is no value in generating suggestions here.
   */
  async flushAllForRoom(roomName) {
    const prefix = `${roomName}-`;
    const keys = [...this.pending.keys()].filter((key) => key.startsWith(prefix));

    await Promise.all(keys.map((key) => this.runStage(key, EVAL)));
  }

  async handleTranscript({
    io,
    roomName,
    role,
    transcript,
    userId,
    isUtteranceEnd,
    speechFinal,
  }) {

    // Normalize so a casing change on the client cannot route interviewer
    // speech into the interviewee branch below.
    const normalizedRole =
      String(role || "").toLowerCase() === "interviewer" ? "interviewer" : "interviewee";

    const key = `${roomName}-${normalizedRole}`;

    const runEvaluation = async (finalTranscript) => {
      if (normalizedRole === "interviewer") {
        const result =
          await interviewController.processInterviewerSpeech(
            roomName,
            finalTranscript,
            userId
          );

        if (result.type === "QUESTION") {
          io.to(roomName).emit("question:detected", result);
        }

        return;
      }

      const result =
        await interviewController.evaluateIntervieweeAnswer(
          roomName,
          finalTranscript,
          userId
        );

      if (result && result.evaluationSkipped) {
        agentLog(
          "PIPELINE",
          roomName,
          `evaluation SKIPPED · ${result.skipReason} · answer not recorded in report`
        );
      }
    };

    const runNextQuestions = async (finalTranscript) => {
      if (normalizedRole === "interviewer") return;

      io.to(roomName).emit("ai-suggestions-pending", { roomName });

      const nextQuestions =
        await interviewController.generateSuggestions(
          roomName,
          finalTranscript,
          userId
        );

      if (nextQuestions) {
        io.to(roomName).emit("ai-suggested-questions", nextQuestions);
      }
    };

    // If UtteranceEnd event triggered by Deepgram VAD silence, start the grace
    // windows instead of flushing immediately.
    if (isUtteranceEnd) {
      this.armStages(key, true, runEvaluation, runNextQuestions);
      return;
    }

    // Append non-empty transcript chunks to buffer
    if (transcript && transcript.trim()) {
      const previous = this.buffers.get(key) || "";
      this.buffers.set(key, `${previous} ${transcript}`.trim());
    }

    // If Deepgram endpointing signals speech_final, start the grace windows.
    if (speechFinal) {
      this.armStages(key, true, runEvaluation, runNextQuestions);
      return;
    }

    // No silence signal yet: arm the long backstop, which is re-armed on every
    // chunk. If a silence signal arrives later, these become grace windows.
    this.armStages(key, false, runEvaluation, runNextQuestions);
  }

}

export default new TranscriptService();