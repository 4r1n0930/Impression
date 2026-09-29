import interviewController from "../controller/InterviewController.js";

class TranscriptService {

  constructor() {
    this.buffers = new Map();
    this.timers = new Map();
  }

  flushBuffer(key, callback) {
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
      this.timers.delete(key);
    }

    const finalTranscript = (this.buffers.get(key) || "").trim();
    this.buffers.delete(key);

    if (finalTranscript.length > 0) {
      callback(finalTranscript);
    }
  }

  async handleTranscript({
    io,
    roomName,
    role,
    transcript,
    userApiKey,
    isUtteranceEnd,
    speechFinal,
  }) {

    const key = `${roomName}-${role}`;

    const processFinalTranscript = async (finalTranscript) => {
      if (role === "interviewer") {

        const result =
          await interviewController.processInterviewerSpeech(
            roomName,
            finalTranscript,
            userApiKey
          );

        if (result.type === "QUESTION") {
          io.to(roomName).emit(
            "question:detected",
            result
          );
        }

      } else {

        const result =
          await interviewController.processIntervieweeSpeech(
            roomName,
            finalTranscript,
            userApiKey
          );

        console.log("Interviewee Answer Evaluated & Suggestions:", result);

        if (result && result.nextQuestions) {
          io.to(roomName).emit(
            "ai-suggested-questions",
            result.nextQuestions
          );
        }

      }
    };

    // If UtteranceEnd event triggered by Deepgram VAD silence, flush buffer immediately
    if (isUtteranceEnd) {
      this.flushBuffer(key, processFinalTranscript);
      return;
    }

    // Append non-empty transcript chunks to buffer
    if (transcript && transcript.trim()) {
      const previous = this.buffers.get(key) || "";
      this.buffers.set(key, `${previous} ${transcript}`.trim());
    }

    // If Deepgram endpointing signals speech_final, flush immediately
    if (speechFinal) {
      this.flushBuffer(key, processFinalTranscript);
      return;
    }

    // Dynamic safety fallback: reset timer on every new audio chunk
    // Generous 12-second timeout so thinking candidates are never cut off mid-thought
    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    const safetyDelay = role === "interviewer" ? 4000 : 12000;
    const timer = setTimeout(() => {
      this.flushBuffer(key, processFinalTranscript);
    }, safetyDelay);

    this.timers.set(key, timer);
  }

}

export default new TranscriptService();