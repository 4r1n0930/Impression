import { nextQuestionPrompt } from "./prompts/nextQuestion.prompt.js";
import { getGeminiModel } from "../config/gemini.js";

class NextQuestionAgent {
  async process(question, evaluation, followUpCount = 0, userApiKey) {
    try {
      const prompt = nextQuestionPrompt(question, evaluation, followUpCount);
      const geminiModel = getGeminiModel(userApiKey);

      const result = await geminiModel.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      let response = result.candidates[0].content.parts[0].text.trim();

      if (response.startsWith("```json")) {
        response = response
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();
      }

      return JSON.parse(response);

    } catch (error) {
      console.error("Next Question Agent Error:", error);

      return {
        action: "NEXT",
        reason: "Unable to analyze.",
        suggestedQuestion: ""
      };
    }
  }
}

export default new NextQuestionAgent();