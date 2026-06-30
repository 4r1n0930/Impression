const { callGemini } = require("../services/geminiService");
const { getQuestionPrompt } = require("../prompts/questionPrompt");

const generateQuestion = async ({ role, difficulty, topic }) => {
  try {
    const prompt = getQuestionPrompt({
      role,
      difficulty,
      topic,
    });

    const question = await callGemini(prompt);

    return question.trim();
  } catch (error) {
    console.error("Question Agent Error:", error.message);
    throw error;
  }
};

module.exports = {
  generateQuestion,
};