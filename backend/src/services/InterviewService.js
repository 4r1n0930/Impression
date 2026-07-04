import InterviewResult from "../models/InterviewResult.js";

class InterviewService {
  async saveAnswer({
    roomName,
    candidate,
    questionId,
    question,
    answer,
  }) {
    let interview = await InterviewResult.findOne({ roomName });

    if (!interview) {
      interview = new InterviewResult({
        roomName,
        candidate,
        responses: [],
      });
    }

    interview.responses.push({
      questionId,
      question,
      answer,
    });

    await interview.save();

    return interview;
  }

  async getInterview(roomName) {
    return await InterviewResult.findOne({ roomName });
  }

  async updateEvaluation({
    roomName,
    questionId,
    score,
    feedback,
  }) {
    return await InterviewResult.updateOne(
      {
        roomName,
        "responses.questionId": questionId,
      },
      {
        $set: {
          "responses.$.score": score,
          "responses.$.feedback": feedback,
        },
      }
    );
  }
}

export default new InterviewService();