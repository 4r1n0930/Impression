import { evaluationPrompt } from "./prompts/evaluationPrompt.js";
import { getGeminiModel } from "../config/gemini.js";

class EvaluationAgent {
  async process(question, answer, userApiKey) {
    console.log("Evaluation Agent Running...");

    try {
      const prompt = evaluationPrompt(question, answer);
      const model = getGeminiModel(userApiKey);

      const result = await model.generateContent({
        model: "gemini-flash-latest",
        location: "global",
        contents: prompt,
      });
      let response =
        result.candidates[0].content.parts[0].text.trim();

      // Remove markdown if Gemini returns ```json ... ```
      if (response.startsWith("```json")) {
        response = response.replace(/```json/g, "").replace(/```/g, "").trim();
      }

      return JSON.parse(response);

    } catch (error) {
      console.error("Evaluation Agent Error:", error);

      return;
    }
  }
}

export default new EvaluationAgent();