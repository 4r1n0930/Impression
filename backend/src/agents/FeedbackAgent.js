import { feedbackPrompt } from "./prompts/feedback.prompt.js";
import { getGeminiModel } from "../config/gemini.js";

class FeedbackAgent {
  async process(evaluations, userApiKey) {
    if (!evaluations || evaluations.length === 0) {
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

    try {
      const prompt = feedbackPrompt(evaluations);
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
      console.error("Feedback Agent Error:", error);

      const count = evaluations.length;
      let sumScore = 0, sumTech = 0, sumComp = 0, sumComm = 0, sumConf = 0;

      evaluations.forEach((item) => {
        const ev = item.evaluation || {};
        sumScore += Number(ev.score ?? 7);
        sumTech += Number(ev.technicalAccuracy ?? 7);
        sumComp += Number(ev.completeness ?? 7);
        sumComm += Number(ev.communication || ev.communicationClarity ?? 7);
        sumConf += Number(ev.confidence ?? 7);
      });

      const avgScore = Number((sumScore / count).toFixed(1));
      const avgTech = Number((sumTech / count).toFixed(1));
      const avgComp = Number((sumComp / count).toFixed(1));
      const avgComm = Number((sumComm / count).toFixed(1));
      const avgConf = Number((sumConf / count).toFixed(1));

      return {
        overallScore: avgScore,
        verdict: avgScore >= 8 ? "Strong Candidate" : avgScore >= 6 ? "Potential Fit" : "Needs Improvement",
        metrics: {
          technicalAccuracy: avgTech,
          completeness: avgComp,
          communicationClarity: avgComm,
          confidence: avgConf
        },
        summary: `Evaluated ${count} technical questions. Candidate scored an average of ${avgScore}/10 across technical accuracy, completeness, and clarity.`
      };
    }
  }
}

export default new FeedbackAgent();
