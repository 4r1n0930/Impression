import { callGemini } from "../services/geminiService.js";
import { getQuestionPrompt } from "../prompts/questionPrompt.js";

const generateQuestions = async ({
  role,
  difficulty,
  topic,
  count = 3,
}) => {
  try {
    const prompt = getQuestionPrompt({
      role,
      difficulty,
      topic,
      count,
    });

    const response = await callGemini(prompt);

    return response
      .split("\n")
      .map((q) => q.trim())
      .filter((q) => q.length > 0)
      .slice(0, count);

  } catch (error) {
    console.error("Question Agent Error:", error.message);
    throw error;
  }
};

export { generateQuestions };