const getQuestionPrompt = ({ role, difficulty, topic }) => {
  return `
You are an experienced technical interviewer.

Generate exactly ONE interview question.

Rules:
- Role: ${role}
- Difficulty: ${difficulty}
- Topic: ${topic}
- Return only the interview question.
- Do not include numbering.
- Do not include explanation.
- Do not include markdown.
`;
};

module.exports = {
  getQuestionPrompt,
};