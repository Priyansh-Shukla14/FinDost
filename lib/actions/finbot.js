// FinBot — the chat server action.
//
// The model never sees the database. It can only ask for one of the tools in
// lib/ai/tools.js, which the server then runs with the session's userId. That
// keeps two things true: FinBot answers from real data rather than guessing,
// and it cannot reach another user's data even if asked to.

"use server";

import { getGeminiClient, MODEL, isAIConfigured } from "@/lib/ai/gemini";
import { toolDeclarations, runTool } from "@/lib/ai/tools";
import { consumeAIRequest } from "@/lib/ai/rateLimit";
import { requireUserId } from "@/lib/session";
import { getCurrentMonthYear, getMonthName, getISTParts } from "@/lib/utils";

// How many times the model may ask for tools before we stop. A normal answer
// takes one or two rounds; this only exists to stop a runaway loop.
const MAX_TOOL_ROUNDS = 5;
const MAX_MESSAGE_LENGTH = 500;
const MAX_HISTORY_MESSAGES = 10;

function buildSystemInstruction() {
  const { month, year } = getCurrentMonthYear();
  const { day } = getISTParts();

  return `You are FinBot, the assistant inside FinDost, a personal expense tracker used in India.

Today's date is ${day} ${getMonthName(month)} ${year} (IST). "This month" means ${getMonthName(month)} ${year}.

How to answer:
- Always call a tool to get numbers. Never estimate, guess or invent an amount.
- If a tool returns no data, say so plainly instead of filling the gap yourself.
- All amounts from tools are in rupees. Write them like ₹1,250 using Indian digit grouping.
- Keep answers short — two or three sentences is usually enough. Do not use markdown tables.
- You may add one brief, practical observation if it genuinely helps, but never lecture.

Boundaries:
- You can only see the data of the person you are talking to. If asked about anyone else's spending, say you can only access their own data.
- You are not a financial advisor. Do not recommend investments, loans or tax strategies.
- If asked something unrelated to this person's expenses and budgets, say that is outside what you can help with.`;
}

function toGeminiContents(history = []) {
  return history
    .slice(-MAX_HISTORY_MESSAGES)
    .filter((m) => m && typeof m.text === "string" && m.text.trim())
    .map((m) => ({
      role: m.role === "model" ? "model" : "user",
      parts: [{ text: m.text.slice(0, MAX_MESSAGE_LENGTH * 4) }],
    }));
}

/**
 * Sends one message to FinBot and returns its answer.
 * history is [{ role: "user" | "model", text: string }].
 */
export async function askFinBot(history, message) {
  try {
    const userId = await requireUserId();

    const question = (message || "").toString().trim();
    if (!question) {
      return { error: "Type a question first." };
    }
    if (question.length > MAX_MESSAGE_LENGTH) {
      return { error: `Please keep your question under ${MAX_MESSAGE_LENGTH} characters.` };
    }

    if (!isAIConfigured()) {
      return { error: "FinBot is not configured yet — GEMINI_API_KEY is missing." };
    }

    const quota = await consumeAIRequest(userId);
    if (!quota.allowed) {
      return {
        error: `You have used all ${quota.limit} AI requests for today. The limit resets tomorrow.`,
      };
    }

    const ai = getGeminiClient();
    const contents = [
      ...toGeminiContents(history),
      { role: "user", parts: [{ text: question }] },
    ];

    for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
      const response = await ai.models.generateContent({
        model: MODEL,
        contents,
        config: {
          systemInstruction: buildSystemInstruction(),
          tools: [{ functionDeclarations: toolDeclarations }],
          temperature: 0.2,
        },
      });

      const calls = response.functionCalls || [];

      // No tool requested means the model is answering
      if (calls.length === 0) {
        const answer = (response.text || "").trim();
        if (!answer) {
          return { error: "FinBot could not put together an answer. Try rephrasing." };
        }
        return { answer, remaining: quota.remaining };
      }

      // Replay the model's turn, then hand back the tool results
      const modelContent = response.candidates?.[0]?.content;
      contents.push(
        modelContent || { role: "model", parts: calls.map((c) => ({ functionCall: c })) }
      );

      const results = await Promise.all(
        calls.map((call) => runTool(call.name, call.args, userId))
      );

      contents.push({
        role: "user",
        parts: calls.map((call, i) => ({
          functionResponse: { name: call.name, response: results[i] },
        })),
      });
    }

    return { error: "That question needed too many lookups. Try asking something narrower." };
  } catch (err) {
    console.error("askFinBot error:", err);
    return { error: "FinBot is having trouble right now. Please try again." };
  }
}
