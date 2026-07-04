export const nextQuestionPrompt = (question, evaluation) => `
You are assisting a human interviewer.

Current Interview Question:
${question}

Evaluation:
${JSON.stringify(evaluation)}

Decide whether the interviewer should ask a follow-up question or move to the next question.

Rules:
- If important concepts are missing, suggest a follow-up.
- If the answer is complete, recommend moving to the next question.

Return ONLY valid JSON.

Format:

{
  "action": "FOLLOW_UP" | "NEXT",
  "reason": "",
  "suggestedQuestion": ""
}

IMPORTANT:
Return raw JSON only.
Do not use markdown.
`;

export default nextQuestionPrompt;