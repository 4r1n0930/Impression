class QuestionAgent {
  constructor() {
    this.currentQuestions = new Map();
  }

  setCurrentQuestion(roomName, question) {
    this.currentQuestions.set(roomName, question);
  }

  getCurrentQuestion(roomName) {
    return this.currentQuestions.get(roomName);
  }

  process(roomName, question) {
    this.setCurrentQuestion(roomName, question);

    return {
      success: true,
      roomName,
      question,
    };
  }

  clear(roomName) {
    this.currentQuestions.delete(roomName);
  }
}

export default new QuestionAgent();