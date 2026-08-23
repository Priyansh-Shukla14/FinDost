// Receipt scanner — reads a bill photo and returns fields for the expense form.
//
// Nothing here writes to the database. The model's output is validated with
// Zod and handed back to the UI, where the user checks it and submits through
// the normal addExpense action. A model misreading a number should never be
// able to create an expense on its own.

"use server";

import { Type } from "@google/genai";
import { getGeminiClient, MODEL, isAIConfigured } from "@/lib/ai/gemini";
import { consumeAIRequest } from "@/lib/ai/rateLimit";
import { requireUserId } from "@/lib/session";
import { receiptSchema, firstError } from "@/lib/validations";
import { todayInputValue, getISTParts } from "@/lib/utils";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

const RECEIPT_PROMPT = `You are reading a photograph of a receipt, bill or payment confirmation.

Extract exactly three things:
- amount: the FINAL total actually paid, as a plain number in rupees. Not the subtotal, not the tax, not any single line item. If the receipt shows a grand total, use that.
- merchant: the name of the shop, restaurant or service. Use an empty string if it is not readable.
- date: the date on the receipt in YYYY-MM-DD format. Use an empty string if it is not readable or not present.

Rules:
- Report the amount as digits only, with no currency symbol and no thousands separators.
- Do not guess. If you cannot read the total clearly, return 0 for the amount.
- If the image is not a receipt at all, return 0 for the amount.`;

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    amount: {
      type: Type.NUMBER,
      description: "Final total paid, in rupees. 0 if unreadable.",
    },
    merchant: {
      type: Type.STRING,
      description: "Shop or service name, empty string if unreadable.",
    },
    date: {
      type: Type.STRING,
      description: "Receipt date as YYYY-MM-DD, empty string if unreadable.",
    },
  },
  required: ["amount", "merchant", "date"],
};

/**
 * Reads a receipt image and returns { merchant, amount, date } for the form.
 * The date is never in the future — an unreadable or future date falls back
 * to today, since the expense form refuses future dates anyway.
 */
export async function scanReceipt(formData) {
  try {
    const userId = await requireUserId();

    if (!isAIConfigured()) {
      return { error: "The scanner is not configured yet — GEMINI_API_KEY is missing." };
    }

    const file = formData.get("image");
    if (!file || typeof file.arrayBuffer !== "function") {
      return { error: "Pick an image first." };
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return { error: "Upload a JPG, PNG or WebP image." };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { error: "That image is over 5 MB. Try a smaller photo." };
    }

    const quota = await consumeAIRequest(userId);
    if (!quota.allowed) {
      return {
        error: `You have used all ${quota.limit} AI requests for today. The limit resets tomorrow.`,
      };
    }

    const bytes = Buffer.from(await file.arrayBuffer());

    const ai = getGeminiClient();
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [
        {
          role: "user",
          parts: [
            { text: RECEIPT_PROMPT },
            { inlineData: { mimeType: file.type, data: bytes.toString("base64") } },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0,
      },
    });

    let parsed;
    try {
      parsed = JSON.parse((response.text || "").trim());
    } catch {
      return { error: "Could not read this receipt. Try a clearer photo." };
    }

    if (!parsed || Number(parsed.amount) <= 0) {
      return {
        error: "Could not find a total on this receipt. Try a clearer photo, or add the expense manually.",
      };
    }

    const result = receiptSchema.safeParse({
      merchant: typeof parsed.merchant === "string" ? parsed.merchant : "",
      amount: Number(parsed.amount),
      date: typeof parsed.date === "string" ? parsed.date : "",
    });

    if (!result.success) {
      return { error: firstError(result, "Could not read this receipt properly.") };
    }

    const { merchant, amount, date } = result.data;

    // A receipt cannot be from the future; anything unreadable becomes today
    const today = todayInputValue();
    const safeDate = date && date <= today ? date : today;

    return {
      data: {
        merchant,
        amount,
        date: safeDate,
        dateWasGuessed: safeDate !== date,
      },
      remaining: quota.remaining,
    };
  } catch (err) {
    console.error("scanReceipt error:", err);
    return { error: "The scanner is having trouble right now. Please try again." };
  }
}
