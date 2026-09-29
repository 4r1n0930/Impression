import { questionIntentPrompt } from "./prompts/questionIntentPrompt.js";
import { getGeminiModel } from "../config/gemini.js";

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

  async process(roomName, transcript, userApiKey) {
    if (!transcript || typeof transcript !== "string" || transcript.trim().length < 5) {
      return {
        success: true,
        isQuestion: false,
        roomName,
        reason: "Transcript too short or empty"
      };
    }

    const trimmed = transcript.trim();

    try {
      const prompt = questionIntentPrompt(trimmed);
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

      const parsed = JSON.parse(response);

      return {
        success: true,
        isQuestion: Boolean(parsed.isQuestion),
        roomName,
        question: parsed.question || trimmed,
      };

    } catch (error) {
      console.error("QuestionAgent Intent Classification Error (falling back to heuristic):", error);

      const heuristicIsQuestion = this.isQuestionHeuristic(trimmed);
      return {
        success: true,
        isQuestion: heuristicIsQuestion,
        roomName,
        question: trimmed,
      };
    }
  }
}

export default new QuestionAgent();