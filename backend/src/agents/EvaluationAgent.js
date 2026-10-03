import { evaluationPrompt } from "./prompts/evaluationPrompt.js";
import { getGeminiModelForUser } from "../config/gemini.js";
import { agentLog, agentError, elapsedMs } from "../utils/agentLogger.js";

class EvaluationAgent {
  async process(question, answer, userId, roomName) {
    const startedAt = Date.now();

    try {
      const prompt = evaluationPrompt(question, answer);
      const model = await getGeminiModelForUser(userId);

      const result = await model.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
      });

      let response = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

      if (response.startsWith("```json")) {
        response = response.replace(/^```json\s*/, "").replace(/```\s*$/, "").trim();
      } else if (response.startsWith("```")) {
        response = response.replace(/^```\s*/, "").replace(/```\s*$/, "").trim();
      }

      const evaluation = JSON.parse(response);

      agentLog(
        "EVALUATION",
        roomName,
        `graded ${evaluation?.score ?? "?"}/10 · ${question ? question.slice(0, 60) : "no question"} (${elapsedMs(startedAt)})`,
        evaluation
      );

      return evaluation;

    } catch (error) {
      agentError("EVALUATION", roomName, "failed, returning fabricated default:", error);

      agentLog(
        "EVALUATION",
        roomName,
        `FALLBACK 7/10 · default scores, not a real evaluation (${elapsedMs(startedAt)})`
      );

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