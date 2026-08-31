// CSV import server action.
//
// The browser does the parsing, because that is what makes the preview
// instant and keeps a 5,000-line statement off the network. None of that is
// trusted here: every row is re-checked, every category is confirmed to
// belong to the signed-in user, and the amounts are re-derived rather than
// taken as sent.
//
// Importing the same statement twice is the normal case, not the edge case —
// people export a fresh CSV each month and the months overlap. Duplicates are
// skipped silently and counted, never written and never deleted.

"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { parseDateOnly } from "@/lib/utils";
import { rowKey } from "@/lib/csv/rows";

// One statement's worth. Large enough for a year of a busy account, small
// enough that a single action stays well inside the request timeout.
const MAX_ROWS = 2000;
const MAX_PAISE = 100000000; // ₹10,00,000, matching lib/validations.js

/**
 * Writes the rows the user confirmed in the preview.
 * Returns { imported, duplicates, rejected } or { error }.
 */
export async function importExpenses(rows) {
  try {
    const userId = await requireUserId();

    if (!Array.isArray(rows) || rows.length === 0) {
      return { error: "There is nothing to import." };
    }
    if (rows.length > MAX_ROWS) {
      return {
        error: `That file has ${rows.length} rows. Please import at most ${MAX_ROWS} at a time.`,
      };
    }

    // Which categories may this user actually write to
    const allowed = await prisma.category.findMany({
      where: { OR: [{ isDefault: true }, { userId }] },
      select: { id: true },
    });
    const allowedIds = new Set(allowed.map((c) => c.id));

    // Re-validate every row server-side. A row that fails here was tampered
    // with or is a bug in the preview; either way it is dropped, not fixed up.
    const clean = [];
    let rejected = 0;

    for (const row of rows) {
      const date = typeof row?.date === "string" ? row.date : "";
      const amountPaise = Number(row?.amountPaise);
      const categoryId = typeof row?.categoryId === "string" ? row.categoryId : "";
      const note = typeof row?.note === "string" ? row.note.trim().slice(0, 200) : "";

      const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(date) ? parseDateOnly(date) : null;

      if (
        !parsedDate ||
        !Number.isInteger(amountPaise) ||
        amountPaise <= 0 ||
        amountPaise > MAX_PAISE ||
        !allowedIds.has(categoryId)
      ) {
        rejected++;
        continue;
      }

      clean.push({ date, parsedDate, amountPaise, note, categoryId });
    }

    if (clean.length === 0) {
      return { imported: 0, duplicates: 0, rejected };
    }

    // Only load the window the import actually covers — a full expense table
    // scan would be pointless when a statement spans two months
    const dates = clean.map((r) => r.parsedDate.getTime());
    const existing = await prisma.expense.findMany({
      where: {
        userId,
        date: { gte: new Date(Math.min(...dates)), lte: new Date(Math.max(...dates)) },
      },
      select: { date: true, amount: true, note: true },
    });

    const seen = new Set(
      existing.map((e) =>
        rowKey({
          date: e.date.toISOString().slice(0, 10),
          amountPaise: e.amount,
          note: e.note,
        })
      )
    );

    const toCreate = [];
    let duplicates = 0;

    for (const row of clean) {
      const key = rowKey({ date: row.date, amountPaise: row.amountPaise, note: row.note });
      if (seen.has(key)) {
        duplicates++;
        continue;
      }
      seen.add(key); // also catches repeats inside this batch
      toCreate.push({
        amount: row.amountPaise,
        note: row.note || null,
        date: row.parsedDate,
        userId,
        categoryId: row.categoryId,
      });
    }

    if (toCreate.length > 0) {
      await prisma.expense.createMany({ data: toCreate });
    }

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/expenses");
    revalidatePath("/dashboard/budgets");
    revalidatePath("/dashboard/subscriptions");

    return { imported: toCreate.length, duplicates, rejected };
  } catch (err) {
    console.error("importExpenses error:", err);
    return { error: "The import failed. Please try again." };
  }
}
