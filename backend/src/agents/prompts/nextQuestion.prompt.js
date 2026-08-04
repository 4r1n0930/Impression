export const nextQuestionPrompt = (
  question = null,
  evaluation = null,
  followUpCount = 0
) => {
  // ==========================
  // INITIAL INTERVIEW
  // ==========================
  if (evaluation === null) {
    return `
You are assisting a human interviewer.

This is the beginning of the interview.

Generate exactly 3 opening interview questions for a java developer.

Rules:
1. Start with fundamental concepts.
2. Gradually increase the difficulty.
3. Do NOT generate follow-up questions because no answer has been evaluated yet.
4. Questions should naturally start the interview.
5. Keep questions concise.
6. Generate a fresh set of opening questions.
7. Do not repeat the same question within the response.

Return ONLY valid JSON.

{
  "questions": [
    {
      "type": "NEXT",
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
  }

  // ==========================
  // AFTER EVALUATION
  // ==========================
  return `
You are assisting a human interviewer.

Current Interview Question:
${question}

Evaluation:
${JSON.stringify(evaluation)}

Follow-up Questions Already Asked:
${followUpCount}

Generate exactly 3 interview question suggestions.

Rules:
1. If followUpCount < 2 AND important concepts are missing, include EXACTLY ONE follow-up question.
2. If followUpCount >= 2, DO NOT generate another follow-up question.
3. Remaining questions should move naturally to the next logical topic.
4. Do not strictly repeat the current interview questions which were asked before make sure that.
5. Keep questions concise.
6. Return exactly 3 questions.

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
};

export default nextQuestionPrompt;