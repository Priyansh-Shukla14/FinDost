// 🎯 Budget Server Actions
// Set, Update, Delete budgets — monthly per category

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
// Upsert — pehle se hai toh update, nahi hai toh create
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
        // Naya budget set hua toh alert flag reset — warna is mahine ka
        // 80% wala alert dobara kabhi nahi jaayega (Phase 6)
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
    return { error: "Budget set nahi ho paya" };
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
      return { error: "Budget nahi mila" };
    }

    refresh();
    return { success: true };
  } catch (err) {
    console.error("deleteBudget error:", err);
    return { error: "Delete nahi ho paya" };
  }
}
