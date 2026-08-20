// Budget server actions — set, update and delete monthly per-category budgets

"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { budgetSchema, firstError } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { toPaise } from "@/lib/utils";

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/budgets");
}

// ===== SET / UPDATE BUDGET =====
// Upsert — update it if it already exists, otherwise create it
export async function setBudget(formData) {
  try {
    const userId = await requireUserId();

    const rawData = {
      amount: parseFloat(formData.get("amount")),
      categoryId: formData.get("categoryId"),
      month: parseInt(formData.get("month")),
      year: parseInt(formData.get("year")),
    };

    const result = budgetSchema.safeParse(rawData);
    if (!result.success) {
      return { error: firstError(result) };
    }

    const { amount, categoryId, month, year } = result.data;

    const category = await prisma.category.findFirst({
      where: {
        id: categoryId,
        OR: [{ isDefault: true }, { userId }],
      },
      select: { id: true },
    });

    if (!category) {
      return { error: "Invalid category" };
    }

    await prisma.budget.upsert({
      where: {
        userId_categoryId_month_year: { userId, categoryId, month, year },
      },
      update: {
        amount: toPaise(amount),
        // A new budget resets the alert flag, otherwise this month's 80%
        // alert would never fire again (phase 6)
        alertSent: false,
      },
      create: {
        amount: toPaise(amount),
        categoryId,
        month,
        year,
        userId,
      },
    });

    refresh();
    return { success: true };
  } catch (err) {
    console.error("setBudget error:", err);
    return { error: "Could not set the budget" };
  }
}

// ===== DELETE BUDGET =====
export async function deleteBudget(budgetId) {
  try {
    const userId = await requireUserId();

    const deleted = await prisma.budget.deleteMany({
      where: { id: budgetId, userId },
    });

    if (deleted.count === 0) {
      return { error: "Budget not found" };
    }

    refresh();
    return { success: true };
  } catch (err) {
    console.error("deleteBudget error:", err);
    return { error: "Could not delete the budget" };
  }
}
