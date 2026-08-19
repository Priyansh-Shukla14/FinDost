// 🛡️ Zod Validation Schemas
// Server-side validation — client pe kuch bhi aaye, yahan pakka check hoga

import { z } from "zod";

// ===== SHARED BITS =====

// Rupees mein amount — limits aur message hamesha match karne chahiye
const rupees = (maxRupees, maxLabel) =>
  z
    .number({ message: "Amount zaroori hai" })
    .refine((v) => Number.isFinite(v), "Valid amount dalo")
    .refine((v) => v > 0, "Amount 0 se zyada hona chahiye")
    .refine((v) => v <= maxRupees, `Amount bahut zyada hai (max ${maxLabel})`);

// "YYYY-MM-DD" calendar date — 2 saal aage se zyada allowed nahi
const dateOnly = z
  .string({ message: "Date zaroori hai" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date YYYY-MM-DD format mein honi chahiye")
  .refine((val) => !isNaN(Date.parse(val)), "Valid date dalo")
  .refine((val) => {
    const year = Number(val.slice(0, 4));
    return year >= 2000 && year <= 2100;
  }, "Date 2000 aur 2100 ke beech honi chahiye");

const optionalNote = z
  .string()
  .max(200, "Note 200 characters se zyada nahi ho sakta")
  .optional()
  .or(z.literal(""));

const emoji = z.string().min(1, "Emoji select karo").max(8, "Invalid emoji");

// ===== EXPENSE SCHEMA =====
export const expenseSchema = z.object({
  amount: rupees(1000000, "₹10,00,000"),
  categoryId: z
    .string({ message: "Category select karo" })
    .min(1, "Category select karo"),
  date: dateOnly,
  note: optionalNote,
});

// ===== BUDGET SCHEMA =====
export const budgetSchema = z.object({
  amount: rupees(10000000, "₹1,00,00,000"),
  categoryId: z
    .string({ message: "Category select karo" })
    .min(1, "Category select karo"),
  month: z.number().int().min(1, "Invalid month").max(12, "Invalid month"),
  year: z.number().int().min(2000, "Invalid year").max(2100, "Invalid year"),
});

// ===== CATEGORY SCHEMA =====
export const categorySchema = z.object({
  name: z
    .string({ message: "Category name zaroori hai" })
    .trim()
    .min(1, "Category name zaroori hai")
    .max(30, "Name 30 characters se zyada nahi"),
  emoji,
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Valid hex color dalo (e.g. #10b981)")
    .default("#10b981"),
});

// Note: Subscription / Goal / 80C ke schemas Phase 6–7 mein aayenge —
// abhi tak sirf Phase 1–3 (auth, expenses, categories, budgets, dashboard).

// ===== SIGNUP SCHEMA =====
export const signupSchema = z.object({
  name: z
    .string({ message: "Name is required" })
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name is too long"),
  email: z
    .string({ message: "Email is required" })
    .trim()
    .toLowerCase()
    .email("Enter a valid email address")
    .max(150, "Email is too long"),
  password: z
    .string({ message: "Password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(72, "Password must be 72 characters or less"), // bcrypt limit
});

/**
 * Zod error se pehla readable message nikalta hai
 */
export function firstError(result, fallback = "Invalid input") {
  return result?.error?.issues?.[0]?.message || fallback;
}
