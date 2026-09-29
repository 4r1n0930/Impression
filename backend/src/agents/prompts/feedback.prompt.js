export const feedbackPrompt = (evaluations) => `
You are a senior technical interviewer and hiring manager reviewing an entire interview transcript and individual question evaluations.

Interview Q&A Evaluations:
${JSON.stringify(evaluations, null, 2)}

Based on all the questions asked, candidate answers, and individual evaluations above, generate a comprehensive overall assessment report.

Rules:
1. Provide an overall score out of 10 (decimal allowed, e.g. 8.5).
2. Determine a professional hiring verdict (e.g. "Strong Candidate", "Hire", "Leaning Hire", "Needs Improvement", "Not Recommended").
3. Compute or aggregate skill metrics out of 10:
   - technicalAccuracy
   - completeness
   - communicationClarity
   - confidence
4. Write a concise, professional executive summary (2-3 sentences) summarizing overall performance, key technical highlights, and areas for improvement.

Return ONLY valid JSON matching this exact structure:

{
  "overallScore": 8.5,
  "verdict": "Strong Candidate",
  "metrics": {
    "technicalAccuracy": 8.8,
    "completeness": 8.2,
    "communicationClarity": 8.5,
    "confidence": 8.5
  },
  "summary": "Demonstrated strong core technical knowledge with clear articulation of fundamental concepts. Showed minor gaps in advanced edge cases but overall gave well-structured responses."
}

IMPORTANT:
Return raw JSON only.
Do not use markdown blocks.
`;

export default feedbackPrompt;
