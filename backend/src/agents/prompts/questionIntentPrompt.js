export const questionIntentPrompt = (transcript) => `
You are an AI assistant in a live technical interview system.
Classify the following speech transcript spoken by the interviewer, and decide whether the candidate's reply to it should be graded.

Interviewer Transcript: "${transcript}"

Return ONLY a JSON object in this format:
\`\`\`json
{
  "isQuestion": true | false,
  "isEvaluable": true | false,
  "category": "technical" | "behavioral" | "logistics" | "smalltalk" | "candidate_question",
  "question": "Extracted cleaned question if isQuestion is true, or empty string"
}
\`\`\`

Categories:
1. "technical" - a fundamental or conceptual question the candidate must answer, e.g. "Explain how closures work", "What is the time complexity of quicksort", "How would you design a rate limiter".
2. "behavioral" - a situational or past-experience question, e.g. "Tell me about a time you resolved a production outage", "Describe a conflict you had with a teammate", "Walk me through your most challenging project".
3. "logistics" - interview mechanics that require no real answer, e.g. "Can you hear me?", "Let's begin", "Do you have any questions for us?", "We are almost out of time", "Please share your screen".
4. "smalltalk" - praise, feedback, fillers, or transitions, e.g. "Good answer", "Nice job", "Mm-hmm", "Okay next question", "Take your time".
5. "candidate_question" - the interviewer is asking something the CANDIDATE must answer as a question for them, not a question for the candidate to answer.

Rules:
1. Set "isEvaluable": true ONLY when "category" is "technical" or "behavioral". It must be false for "logistics", "smalltalk" and "candidate_question".
2. Set "isQuestion": true for "technical", "behavioral" and "candidate_question". It must be false for "logistics" and "smalltalk".
3. Small talk ("hello", "hi", "can you hear me"), feedback ("good answer", "okay", "nice job"), transitions ("moving on", "let's see") or random chatter are NOT questions.
4. If "isQuestion" is true, strip leading fillers like "So yeah...", "Okay next question..." so "question" holds only the clean interview question.
5. Never set "isEvaluable" to true together with a non-evaluable category.
`;