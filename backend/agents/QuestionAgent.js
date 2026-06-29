class QuestionAgent {
  constructor() {
    this.currentQuestion = null;
  }

  process(text) {
    console.log("Question Agent Received:", text);

    return {
      isQuestion: true,
      question: text,
    };
  }
}

module.exports = new QuestionAgent();