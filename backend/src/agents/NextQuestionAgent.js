import { nextQuestionPrompt } from "./prompts/nextQuestion.prompt.js";
import { model } from "../config/gemini.js";

class NextQuestionAgent {
  async process(question, evaluation) {
    try {
      const prompt = nextQuestionPrompt(question, evaluation);

      const result = await model.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      let response = result.text().trim();

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