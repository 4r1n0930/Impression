import { evaluationPrompt } from "./prompts/evaluationPrompt.js";
import { getGeminiModel } from "../config/gemini.js";

class EvaluationAgent {
  async process(question, answer, userApiKey) {
    console.log("Evaluation Agent Running...");

    try {
      const prompt = evaluationPrompt(question, answer);
      const model = getGeminiModel(userApiKey);

      const result = await model.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      let response = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

      if (response.startsWith("```json")) {
        response = response.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
      } else if (response.startsWith("```")) {
        response = response.replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
      }

      return JSON.parse(response);

    } catch (error) {
      console.error("Evaluation Agent Error:", error);

      return;
    }
  }
}

export default new EvaluationAgent();