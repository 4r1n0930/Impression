import { feedbackPrompt } from "./prompts/feedback.prompt.js";
import { getGeminiModelForUser } from "../config/gemini.js";
import { agentLog, agentError, elapsedMs } from "../utils/agentLogger.js";

class FeedbackAgent {
  async process(evaluations, userId, roomName) {
    if (!evaluations || evaluations.length === 0) {
      agentLog("FEEDBACK", roomName, "no evaluations recorded · no report generated");
      return {
        overallScore: 0,
        verdict: "No Data Available",
        metrics: {
          technicalAccuracy: 0,
          completeness: 0,
          communicationClarity: 0,
          confidence: 0
        },
        summary: "No live interview Q&A evaluation records were found for this session."
      };
    }

    const startedAt = Date.now();

    try {
      const prompt = feedbackPrompt(evaluations);
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

      agentLog(
        "FEEDBACK",
        roomName,
        `${JSON.stringify(parsed?.verdict)} · ${evaluations.length} answers · ${parsed?.overallScore ?? "?"}/10 (${elapsedMs(startedAt)})`,
        parsed
      );

      return parsed;
    } catch (error) {
      agentError("FEEDBACK", roomName, "failed, returning arithmetic average:", error);

      const count = evaluations.length;
      let sumScore = 0, sumTech = 0, sumComp = 0, sumComm = 0, sumConf = 0;

      evaluations.forEach((item) => {
        const ev = item.evaluation || {};
        sumScore += Number(ev.score ?? 7);
        sumTech += Number(ev.technicalAccuracy ?? 7);
        sumComp += Number(ev.completeness ?? 7);
        sumComm += Number((ev.communication || ev.communicationClarity) ?? 7);
        sumConf += Number(ev.confidence ?? 7);
      });

      const avgScore = Number((sumScore / count).toFixed(1));
      const avgTech = Number((sumTech / count).toFixed(1));
      const avgComp = Number((sumComp / count).toFixed(1));
      const avgComm = Number((sumComm / count).toFixed(1));
      const avgConf = Number((sumConf / count).toFixed(1));

      const summary = `Evaluated ${count} technical questions. Candidate scored an average of ${avgScore}/10 across technical accuracy, completeness, and clarity.`;

      agentLog(
        "FEEDBACK",
        roomName,
        `FALLBACK AVG ${avgScore}/10 · arithmetic mean of ${count} evaluations, not an AI verdict`
      );

      return {
        overallScore: avgScore,
        verdict: avgScore >= 8 ? "Strong Candidate" : avgScore >= 6 ? "Potential Fit" : "Needs Improvement",
        metrics: {
          technicalAccuracy: avgTech,
          completeness: avgComp,
          communicationClarity: avgComm,
          confidence: avgConf
        },
        summary
      };
    }
  }
}

export default new FeedbackAgent();
