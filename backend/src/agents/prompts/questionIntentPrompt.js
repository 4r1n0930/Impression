export const questionIntentPrompt = (transcript) => `
You are an AI assistant in a live technical interview system.
Your task is to classify whether the following speech transcript spoken by the interviewer is an actual interview question intended for the candidate to answer, or if it is just conversational speech, feedback, or small talk.

Interviewer Transcript: "${transcript}"

Return ONLY a JSON object in this format:
\`\`\`json
{
  "isQuestion": true | false,
  "question": "Extracted cleaned question if isQuestion is true, or empty string"
}
\`\`\`

Rules:
1. Small talk ("hello", "hi", "can you hear me"), feedback ("good answer", "okay", "nice job"), transitions ("moving on", "let's see"), or random chatter are NOT questions ("isQuestion": false).
2. Direct questions asking candidate to explain, code, describe, solve, or answer technical/behavioral topics ARE questions ("isQuestion": true).
3. If isQuestion is true, clean up any leading fillers like "So yeah...", "Okay next question...", so "question" contains just the clear interview question.
`;
