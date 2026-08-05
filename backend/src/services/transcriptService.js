import interviewController from "../controller/InterviewController.js";

class TranscriptService {

  constructor(interviewController) {
    this.interviewController = interviewController;
    this.buffers = new Map();
    this.timers = new Map();
  }
  async handleBufferedTranscript({
    key,
    transcript,
    delay,
    callback,
  }) {
    const previous = this.buffers.get(key) || "";

    this.buffers.set(
      key,
      `${previous} ${transcript}`.trim()
    );

    if (this.timers.has(key)) {
      clearTimeout(this.timers.get(key));
    }

    const timer = setTimeout(async () => {
      const finalTranscript =
        (this.buffers.get(key) || "").trim();

      this.buffers.delete(key);
      this.timers.delete(key);

      if (finalTranscript.length > 0) {
        await callback(finalTranscript);
      }
    }, delay);

    this.timers.set(key, timer);
  }

  async handleTranscript({
    io,
    roomName,
    role,
    transcript,
    interviewSessions,
  }) {

    const key = `${roomName}-${role}`;

    await this.handleBufferedTranscript({
      key,
      transcript,
      delay: role === "interviewer" ? 2500 : 5000,

      callback: async (finalTranscript) => {

        if (role === "interviewer") {

          const result =
            await interviewController.processInterviewerSpeech(
              roomName,
              finalTranscript
            );

          if (result.type === "QUESTION") {

            interviewSessions.get(roomName).currentQuestion =
              result.question;

            io.to(roomName).emit(
              "question:detected",
              result
            );
          }

        } else {

          const result =
            await interviewController.processIntervieweeSpeech(
              roomName,
              finalTranscript
            );

          console.log(result);

          io.to(roomName).emit(
            "ai-suggested-questions",
            result.nextQuestions
          );

        }

      },
    });

  }

}

export default new TranscriptService();