
const getQuestionPrompt = ({
  role,
  difficulty,
  topic,
  count = 3,
}) => {
  return `
You are an experienced technical interviewer.

Generate exactly ${count} interview questions.

Role: ${role}
Difficulty: ${difficulty}
Topic: ${topic}

Rules:
- Return only interview questions.
- One question per line.
- No numbering.
- No explanation.
- No markdown.
`;
};

export { getQuestionPrompt };