export const nextQuestionPrompt = (
  question,
  evaluation,
  followUpCount = 0
) => `
You are assisting a human interviewer.

Current Interview Question:
${question}

Evaluation:
${JSON.stringify(evaluation)}

Follow-up Questions Already Asked:
${followUpCount}

Generate exactly 3 interview question suggestions.

Rules:
1. If followUpCount < 2 and important concepts are missing, include ONE follow-up question.
2. If followUpCount >= 2, DO NOT generate another follow-up. Move to the next logical topic.
3. Remaining questions should be new questions that naturally continue the interview.
4. Do not repeat the current question.
5. Keep questions concise.

Return ONLY valid JSON.

{
  "questions": [
    {
      "type": "FOLLOW_UP | NEXT",
      "question": ""
    },
    {
      "type": "NEXT",
      "question": ""
    },
    {
      "type": "NEXT",
      "question": ""
    }
  ]
}

IMPORTANT:
Return raw JSON only.
Do not use markdown.
`;

export default nextQuestionPrompt;