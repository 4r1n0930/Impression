import { nextQuestionPrompt } from "./prompts/nextQuestion.prompt.js";
import { getGeminiModelForUser } from "../config/gemini.js";
import { agentLog, agentError, elapsedMs } from "../utils/agentLogger.js";

class NextQuestionAgent {
  async process(question, evaluation, followUpCount = 0, userId, roomName) {
    const startedAt = Date.now();

    try {
      const prompt = nextQuestionPrompt(question, evaluation, followUpCount);
      const geminiModel = await getGeminiModelForUser(userId);

      const result = await geminiModel.generateContent({
        model: "gemini-3.5-flash-lite",
        contents: prompt,
      });

      let response = result.text || result.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";

      if (response.startsWith("```json")) {
        response = response
          .replace(/^```json\s*/, "")
          .replace(/```\s*$/, "")
          .trim();
      } else if (response.startsWith("```")) {
        response = response
          .replace(/^```\s*/, "")
          .replace(/```\s*$/, "")
          .trim();
      }

      const parsed = JSON.parse(response);

      agentLog(
        "NEXTQ",
        roomName,
        `${parsed?.questions?.length ?? 0} suggestions · followUpCount=${followUpCount} (${elapsedMs(startedAt)})`,
        parsed
      );

      return parsed;

    } catch (error) {
      agentError("NEXTQ", roomName, "failed, returning static suggestions:", error);

      agentLog("NEXTQ", roomName, `FALLBACK · 3 static suggestions (${elapsedMs(startedAt)})`);

      return {
        questions: [
          { type: "NEXT", question: "Can you describe a challenging technical problem you solved recently?" },
          { type: "NEXT", question: "What are the key principles of clean code and software design you follow?" },
          { type: "NEXT", question: "How do you handle performance bottlenecks in your applications?" }
        ]
      };
    }
  }
}

export default new NextQuestionAgent();