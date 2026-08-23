// Zod validation schemas.
// Server-side validation — whatever the client sends, it is checked here.

import { z } from "zod";

// ===== SHARED BITS =====

// An amount in rupees — the limit and the message must always agree
const rupees = (maxRupees, maxLabel) =>
  z
    .number({ message: "Amount is required" })
    .refine((v) => Number.isFinite(v), "Enter a valid amount")
    .refine((v) => v > 0, "Amount must be greater than 0")
    .refine((v) => v <= maxRupees, `Amount is too large (max ${maxLabel})`);

// A "YYYY-MM-DD" calendar date, between the year 2000 and 2100
const dateOnly = z
  .string({ message: "Date is required" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
  .refine((val) => !isNaN(Date.parse(val)), "Enter a valid date")
  .refine((val) => {
    const year = Number(val.slice(0, 4));
    return year >= 2000 && year <= 2100;
  }, "Date must be between 2000 and 2100");

const optionalNote = z
  .string()
  .max(200, "Note cannot be longer than 200 characters")
  .optional()
  .or(z.literal(""));

const emoji = z.string().min(1, "Pick an emoji").max(8, "Invalid emoji");

// ===== EXPENSE SCHEMA =====
export const expenseSchema = z.object({
  amount: rupees(1000000, "₹10,00,000"),
  categoryId: z
    .string({ message: "Select a category" })
    .min(1, "Select a category"),
  date: dateOnly,
  note: optionalNote,
});

// ===== BUDGET SCHEMA =====
export const budgetSchema = z.object({
  amount: rupees(10000000, "₹1,00,00,000"),
  categoryId: z
    .string({ message: "Select a category" })
    .min(1, "Select a category"),
  month: z.number().int().min(1, "Invalid month").max(12, "Invalid month"),
  year: z.number().int().min(2000, "Invalid year").max(2100, "Invalid year"),
});

// ===== CATEGORY SCHEMA =====
export const categorySchema = z.object({
  name: z
    .string({ message: "Category name is required" })
    .trim()
    .min(1, "Category name is required")
    .max(30, "Name cannot be longer than 30 characters"),
  emoji,
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Enter a valid hex color (e.g. #10b981)")
    .default("#10b981"),
});

// ===== RECEIPT SCHEMA =====
// What the vision model is allowed to hand back after reading a receipt.
// Nothing reaches the expense form until it has passed through here — a model
// can return anything, including a number that is not a number.
export const receiptSchema = z.object({
  merchant: z
    .string()
    .trim()
    .max(100)
    .optional()
    .transform((v) => v || ""),
  amount: z
    .number({ message: "Could not read an amount from this receipt" })
    .refine((v) => Number.isFinite(v), "Could not read a valid amount")
    .refine((v) => v > 0, "The amount on this receipt is not valid")
    .refine((v) => v <= 1000000, "That amount looks too large to be right"),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional()
    .or(z.literal(""))
    .transform((v) => v || ""),
});

// Note: schemas for subscriptions, goals and 80C entries arrive in phases 6-7.

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
 * Pulls the first readable message out of a Zod error
 */
export function firstError(result, fallback = "Invalid input") {
  return result?.error?.issues?.[0]?.message || fallback;
}
