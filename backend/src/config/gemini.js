import { GoogleGenAI } from "@google/genai";
import { resolveApiKey } from "../services/geminiKeyService.js";

// apiKey -> ai.models. Reused across calls, since constructing a client per
// request is pure overhead.
const clientCache = new Map();

/**
 * Pure factory: takes an already-resolved key. Prefer getGeminiModelForUser()
 * outside of tests, so that key resolution happens in exactly one place.
 */
export function getGeminiModel(apiKey) {
  const key = (apiKey && String(apiKey).trim()) || (process.env.GEMINI_API_KEY || "").trim();

  if (!key) {
    throw new Error("No Gemini API Key provided and GEMINI_API_KEY environment variable is not configured.");
  }

  if (!clientCache.has(key)) {
    clientCache.set(key, new GoogleGenAI({ apiKey: key }).models);
  }

  return clientCache.get(key);
}

/**
 * The key does not exist as a plain string on the socket or in session data:
 * it stays encrypted at rest and is decrypted on demand by geminiKeyService.
 */
export async function getGeminiModelForUser(userId) {
  const apiKey = await resolveApiKey(userId);
  return getGeminiModel(apiKey);
}