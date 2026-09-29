export const nextQuestionPrompt = (
  question,
  evaluationOrTranscript,
  followUpCount = 0
) => {
  // If no evaluation or transcript yet, return opening questions prompt
  if (evaluationOrTranscript === null || evaluationOrTranscript === undefined) {
    return `
You are assisting a human interviewer.

This is the beginning of the interview.

Generate exactly 3 opening interview questions for a fresher in IT sector.

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

  const contextData = typeof evaluationOrTranscript === "string"
    ? `Candidate Answer Transcript:\n${evaluationOrTranscript}`
    : `Evaluation Report:\n${JSON.stringify(evaluationOrTranscript)}`;

  return `
You are assisting a human interviewer.

Current Interview Question:
${question}

${contextData}

Follow-up Questions Already Asked:
${followUpCount}

Generate exactly 3 interview question suggestions.

Rules:
1. If followUpCount < 2, include ONE follow-up question related to the candidate's response.
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
};

export default nextQuestionPrompt;