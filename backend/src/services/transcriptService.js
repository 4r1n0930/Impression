import interviewController from "../controller/InterviewController.js";

class TranscriptService {

  constructor() {
    this.answerBuffers = new Map();
    this.answerTimers = new Map();
  }

  async handleTranscript({
    io,
    roomName,
    role,
    transcript,
    interviewSessions,
    userApiKey,
  }) {

    if (role === "interviewer") {

      const result =
        await interviewController.processInterviewerSpeech(
          roomName,
          transcript
        );

      if (result.type === "QUESTION") {

        interviewSessions.get(roomName).currentQuestion =
          result.question;

        io.to(roomName).emit(
          "question:detected",
          result
        );
      }

      return;
    }

    if (role === "interviewee") {

      const previous =
        this.answerBuffers.get(roomName) || "";

      this.answerBuffers.set(
        roomName,
        previous + " " + transcript
      );

      if (this.answerTimers.has(roomName)) {
        clearTimeout(
          this.answerTimers.get(roomName)
        );
      }

      const timer = setTimeout(async () => {

        const finalAnswer =
          this.answerBuffers.get(roomName).trim();

        const evaluation =
          await interviewController.processIntervieweeSpeech(
            roomName,
            finalAnswer,
            userApiKey
          );

        console.log(evaluation);

        io.to(roomName).emit(
          "answer:evaluated",
          evaluation
        );

        this.answerBuffers.delete(roomName);
        this.answerTimers.delete(roomName);

      }, 5000);

      this.answerTimers.set(roomName, timer);
    }

  }

}

export default new TranscriptService();