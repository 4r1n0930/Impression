class QuestionAgent {
  constructor() {
    this.currentQuestion = null;
  }

  setCurrentQuestion(question) {
    this.currentQuestion = question;
  }

  getCurrentQuestion() {
    return this.currentQuestion;
  }

  process(question) {
    this.setCurrentQuestion(question);

    return {
      success: true,
      question,
    };
  }
}

export default new QuestionAgent();