const QuestionAgent = require("./QuestionAgent");

class AgentManager {
  processMessage(speaker, text) {
    console.log(`Speaker: ${speaker}`);
    console.log(`Text: ${text}`);

    if (speaker === "interviewer") {
      const result = QuestionAgent.process(text);

      console.log("Question Agent Result:", result);

      return result;
    }

    return null;
  }
}

module.exports = new AgentManager();