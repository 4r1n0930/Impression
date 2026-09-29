import { nextQuestionPrompt } from "./prompts/nextQuestion.prompt.js";
import { getGeminiModel } from "../config/gemini.js";

class NextQuestionAgent {
  async process(question, evaluation, followUpCount = 0, userApiKey) {
    try {
      const prompt = nextQuestionPrompt(question, evaluation, followUpCount);
      const geminiModel = getGeminiModel(userApiKey);

      const result = await geminiModel.generateContent({
        model: "gemini-flash-latest",
        contents: prompt,
      });

      let response = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

      if (response.startsWith("```json")) {
        response = response
          .replace(/^```json\s*/, "")
          .replace(/```\s*$/, "")
          .trim();
      } else if (response.startsWith("```")) {
        response = response
          .replace(/^```\s*/, "")
          .replace(/```\s*$/, "")
          .trim();
      }

      return JSON.parse(response);

    } catch (error) {
      console.error("Next Question Agent Error:", error);

      return {
        questions: [
          { type: "NEXT", question: "Can you describe a challenging technical problem you solved recently?" },
          { type: "NEXT", question: "What are the key principles of clean code and software design you follow?" },
          { type: "NEXT", question: "How do you handle performance bottlenecks in your applications?" }
        ]
      };
    }
  }
}

export default new NextQuestionAgent();