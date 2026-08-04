import { nextQuestionPrompt } from "./prompts/nextQuestion.prompt.js";
import { model } from "../config/gemini.js";

class NextQuestionAgent {
  async process(question = null, evaluation = null, followUpCount = 0) {
    try {
      const prompt = nextQuestionPrompt(question, evaluation, followUpCount);

      const result = await model.generateContent({
        model: "gemini-flash-latest",
        location: "global",
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