import User from "../models/User.js";
import { decrypt } from "../utils/cryptoUtils.js";

// userId -> { apiKey, primedAt }
const cache = new Map();

const CACHE_TTL_MS = 10 * 60 * 1000;

function serverKey() {
  return (process.env.GEMINI_API_KEY || "").trim();
}

/**
 * Resolves the Gemini API key for a userId.
 *
 * This is the single resolution path for every Gemini call in the app, so the
 * per-answer agents and the overall report always bill the same key.
 *
 * Never throws: a throw here would be swallowed by the agents' catch blocks and
 * silently turned into a fabricated score. A database failure degrades to the
 * server key instead.
 */
export async function resolveApiKey(userId) {
  const fallback = () => serverKey();

  if (!userId) return fallback();

  const key = String(userId);

  const hit = cache.get(key);
  if (hit && Date.now() - hit.primedAt < CACHE_TTL_MS) {
    return hit.apiKey || fallback();
  }

  try {
    const user = await User.findById(key).select("geminiApiKey").lean();
    const apiKey = user?.geminiApiKey ? decrypt(user.geminiApiKey).trim() : "";

    cache.set(key, { apiKey, primedAt: Date.now() });

    return apiKey || fallback();
  } catch (error) {
    console.error("Failed to resolve Gemini API key for user:", error.message);
    // Do not cache failures, so a transient DB error can recover on the next call.
    return fallback();
  }
}

/**
 * Warms the cache for a userId. Called once when a socket joins a room so that
 * grading during the interview does not hit the database on every answer.
 */
export async function primeApiKey(userId) {
  try {
    await resolveApiKey(userId);
    return true;
  } catch (error) {
    console.error("Failed to prime Gemini API key for user:", error.message);
    return false;
  }
}

export function invalidateApiKey(userId) {
  if (!userId) return;
  cache.delete(String(userId));
}

export function clearApiKeyCache() {
  cache.clear();
}