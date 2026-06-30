const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const { GoogleGenerativeAI } = require("@google/generative-ai");
const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash",
});

const callGemini = async (prompt) => {
  try {
    const result = await model.generateContent(prompt);

    return result.response.text();
  } catch (error) {
    console.error("Gemini Error:", error.message);
    throw new Error("Failed to generate AI response.");
  }
};

module.exports = {
  callGemini,
};