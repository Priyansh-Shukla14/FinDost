// Expense server actions — add, edit and delete, all scoped to session.user.id

"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { expenseSchema, firstError } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { toPaise, parseDateOnly } from "@/lib/utils";

// Is this category available to the user (a default one, or their own)?
async function assertCategory(categoryId, userId) {
  return prisma.category.findFirst({
    where: {
      id: categoryId,
      OR: [{ isDefault: true }, { userId }],
    },
    select: { id: true },
  });
}

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/budgets");
}

// ===== ADD EXPENSE =====
export async function addExpense(formData) {
  try {
    const userId = await requireUserId();

    const rawData = {
      amount: parseFloat(formData.get("amount")),
      categoryId: formData.get("categoryId"),
      date: formData.get("date"),
      note: (formData.get("note") || "").toString().trim(),
    };

    const result = expenseSchema.safeParse(rawData);
    if (!result.success) {
      return { error: firstError(result) };
    }

    const { amount, categoryId, date, note } = result.data;

    if (!(await assertCategory(categoryId, userId))) {
      return { error: "Invalid category" };
    }

    await prisma.expense.create({
      data: {
        amount: toPaise(amount),
        categoryId,
        date: parseDateOnly(date), // UTC midnight, to avoid timezone shifts
        note: note || null,
        userId,
      },
    });

    refresh();
    return { success: true };
  } catch (err) {
    console.error("addExpense error:", err);
    return { error: "Something went wrong. Please try again." };
  }
}

// ===== EDIT EXPENSE =====
export async function editExpense(expenseId, formData) {
  try {
    const userId = await requireUserId();

    const rawData = {
      amount: parseFloat(formData.get("amount")),
      categoryId: formData.get("categoryId"),
      date: formData.get("date"),
      note: (formData.get("note") || "").toString().trim(),
    };

    const result = expenseSchema.safeParse(rawData);
    if (!result.success) {
      return { error: firstError(result) };
    }

    const { amount, categoryId, date, note } = result.data;

    if (!(await assertCategory(categoryId, userId))) {
      return { error: "Invalid category" };
    }

    // Ownership check and update in a single query — no race condition
    const updated = await prisma.expense.updateMany({
      where: { id: expenseId, userId },
      data: {
        amount: toPaise(amount),
        categoryId,
        date: parseDateOnly(date),
        note: note || null,
      },
    });

    if (updated.count === 0) {
      return { error: "Expense not found, or you don't have access to it" };
    }

    refresh();
    return { success: true };
  } catch (err) {
    console.error("editExpense error:", err);
    return { error: "Could not update the expense. Please try again." };
  }
}

// ===== DELETE EXPENSE =====
export async function deleteExpense(expenseId) {
  try {
    const userId = await requireUserId();

    const deleted = await prisma.expense.deleteMany({
      where: { id: expenseId, userId },
    });

    if (deleted.count === 0) {
      return { error: "Expense not found, or you don't have access to it" };
    }

    refresh();
    return { success: true };
  } catch (err) {
    console.error("deleteExpense error:", err);
    return { error: "Could not delete the expense" };
  }
}
