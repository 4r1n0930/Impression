import { GoogleGenAI } from "@google/genai";

export function getGeminiModel(userApiKey) {
  const apiKey = (userApiKey && userApiKey.trim()) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("No Gemini API Key provided and GEMINI_API_KEY environment variable is not configured.");
  }
  const ai = new GoogleGenAI({ apiKey });
  return ai.models;
}

const defaultApiKey = process.env.GEMINI_API_KEY || "fallback_key";
const ai = new GoogleGenAI({
  apiKey: defaultApiKey,
});

export const model = ai.models;

