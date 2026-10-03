import { questionIntentPrompt } from "./prompts/questionIntentPrompt.js";
import { getGeminiModelForUser } from "../config/gemini.js";
import { agentLog, agentError, elapsedMs, NON_EVALUABLE_CATEGORIES } from "../utils/agentLogger.js";

const VALID_CATEGORIES = ["technical", "behavioral", ...NON_EVALUABLE_CATEGORIES];

/**
 * The model decides evaluability, but an unknown category fails closed and a
 * self-contradictory answer is downgraded, so small talk can never be graded.
 */
export function normalizeClassification(parsed) {
  const rawCategory = String(parsed?.category || "").trim().toLowerCase();
  const category = VALID_CATEGORIES.includes(rawCategory) ? rawCategory : "smalltalk";

  let isEvaluable = parsed?.isEvaluable === true;

  if (!VALID_CATEGORIES.includes(rawCategory)) {
    isEvaluable = false;
  } else if (isEvaluable && NON_EVALUABLE_CATEGORIES.includes(category)) {
    isEvaluable = false;
  }

  return { category, isEvaluable };
}

class QuestionAgent {
  isQuestionHeuristic(transcript) {
    if (!transcript || typeof transcript !== "string") return false;
    const clean = transcript.trim().toLowerCase();

    // Ignore short fillers or greetings
    if (clean.length < 10) return false;
    const fillerOnly = /^(hello|hi|hey|okay|ok|thanks|thank you|good|great|nice|yes|no|can you hear me|testing|right|sounds good)\.?$/i;
    if (fillerOnly.test(clean)) return false;

    // Check common question indicators
    const questionStarters = [
      "what", "how", "why", "can you", "could you", "tell me", "explain",
      "describe", "where", "when", "which", "is there", "are there", "do you",
      "have you", "would you", "how would", "walk me through"
    ];
    const endsWithQuestion = clean.endsWith("?");
    const startsWithQuestionWord = questionStarters.some(starter => clean.startsWith(starter));

    return endsWithQuestion || startsWithQuestionWord;
  }

  async process(roomName, transcript, userId) {
    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 5) {
      agentLog("QUESTION", roomName, "too short · skipped", transcript);
      return {
        success: true,
        isQuestion: false,
        isEvaluable: false,
        category: "smalltalk",
        roomName,
        reason: "Transcript too short or empty",
      };
    }

    const trimmed = transcript.trim();
    const startedAt = Date.now();

    try {
      const prompt = questionIntentPrompt(trimmed);
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

      const parsed = JSON.parse(response);
      const { category, isEvaluable } = normalizeClassification(parsed);

      agentLog(
        "QUESTION",
        roomName,
        `${category} · ${isEvaluable ? "EVALUABLE" : "skipped"} · ${JSON.stringify(parsed?.question || trimmed)} (${elapsedMs(startedAt)})`,
        parsed
      );

      return {
        success: true,
        isQuestion: Boolean(parsed.isQuestion),
        isEvaluable,
        category,
        roomName,
        question: parsed.question || trimmed,
      };
    } catch (error) {
      agentError("QUESTION", roomName, "classification failed, falling back to heuristic:", error);

      const heuristicIsQuestion = this.isQuestionHeuristic(trimmed);

      agentLog(
        "QUESTION",
        roomName,
        `${heuristicIsQuestion ? "technical" : "smalltalk"} · HEURISTIC · ${JSON.stringify(trimmed)}`
      );

      return {
        success: true,
        isQuestion: heuristicIsQuestion,
        isEvaluable: heuristicIsQuestion,
        category: heuristicIsQuestion ? "technical" : "smalltalk",
        roomName,
        question: trimmed,
      };
    }
  }
}

export default new QuestionAgent();