// Gemini client.
//
// Everything provider-specific lives in this one file, so swapping to another
// model provider later means rewriting this file and nothing else.

import { GoogleGenAI } from "@google/genai";

// Pinned rather than using a "-latest" alias, so behaviour does not change
// underneath the app without a code change. Override with GEMINI_MODEL.
//
// Note: gemini-2.5-flash is closed to new API keys, so it is not a safe
// fallback. Check https://ai.google.dev/gemini-api/docs/models before changing.
export const MODEL = process.env.GEMINI_MODEL || "gemini-3.6-flash";

let client = null;

/**
 * Returns the shared Gemini client, or null when no API key is configured.
 * Callers must handle null so the app still runs without AI configured.
 */
export function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;

  if (!client) {
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}

export function isAIConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}
