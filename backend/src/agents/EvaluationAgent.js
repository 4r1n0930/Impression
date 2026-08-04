import { evaluationPrompt } from "./prompts/evaluationPrompt.js";
import { getGeminiModel } from "../config/gemini.js";

class EvaluationAgent {
  async process(question, answer, userApiKey) {
    console.log("Evaluation Agent Running...");

    try {
      const prompt = evaluationPrompt(question, answer);
      const geminiModel = getGeminiModel(userApiKey);

      const result = await geminiModel.generateContent({
        model: "gemini-2.5-flash",
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

      return {
        score: 0,
        technicalAccuracy: 0,
        completeness: 0,
        communication: 0,
        confidence: 0,
        strengths: [],
        weaknesses: [],
        missingConcepts: [],
        followUpRequired: false,
        followUpReason: "Evaluation Failed"
      };
    }
  }
}

export default new EvaluationAgent();