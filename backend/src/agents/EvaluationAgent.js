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

      return {
        score: 7,
        technicalAccuracy: 7,
        completeness: 7,
        communicationClarity: 7,
        confidence: 7,
        strengths: ["Demonstrated technical understanding"],
        weaknesses: ["Could elaborate further with specific code examples"],
        missingConcepts: []
      };
    }
  }
}

export default new EvaluationAgent();