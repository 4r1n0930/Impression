export const evaluationPrompt = (question, answer) => `
You are an experienced technical interviewer.

Evaluate the candidate's answer based on the interview question.

Question:
${question}

Candidate Answer:
${answer}

Evaluate on the following:

1. Technical Accuracy (0-10)
2. Completeness (0-10)
3. Communication Clarity (0-10)
4. Confidence (0-10)

Notes:
- The candidate answer below may contain follow-up responses separated by blank lines. Treat them as parts of one continuous answer to this question and evaluate the answer as a whole.
- Judge completeness across all the parts together. Do not penalise the candidate for an answer that was simply cut short by a follow-up question.

Also provide:

- Overall Score (0-10)
- Strengths
- Weaknesses
- Missing Concepts
- Follow Up Required (true/false)
- Follow Up Reason

Return ONLY valid JSON.

Example Output:

{
  "score": 8,
  "technicalAccuracy": 9,
  "completeness": 8, 
  "communication": 8,
  "confidence": 7,
  "strengths": [
    "Correct explanation"
  ],
  "weaknesses": [
    "Missed Isolation example"
  ],
  "missingConcepts": [
    "Isolation example"
  ],
  "followUpRequired": true,
  "followUpReason": "Candidate explained ACID but missed Isolation example."
}
IMPORTANT:
Return ONLY raw JSON.
Do not use markdown.
Do not wrap the JSON inside \`\`\`json\`\`\` blocks.
Do not include any explanation before or after the JSON.
`;

export default evaluationPrompt;