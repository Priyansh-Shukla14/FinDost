// Category server actions — read the available categories,
// and create or delete custom ones

"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { categorySchema, firstError } from "@/lib/validations";
import { revalidatePath } from "next/cache";

function refresh() {
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/expenses");
  revalidatePath("/dashboard/budgets");
}

// ===== GET ALL CATEGORIES =====
// System defaults plus the user's own categories
export async function getCategories() {
  try {
    const userId = await requireUserId();

    const categories = await prisma.category.findMany({
      where: {
        OR: [{ isDefault: true }, { userId }],
      },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });

    return { categories };
  } catch (err) {
    console.error("getCategories error:", err);
    return { categories: [] };
  }
}

// ===== ADD CUSTOM CATEGORY =====
export async function addCustomCategory(formData) {
  try {
    const userId = await requireUserId();

    const rawData = {
      name: (formData.get("name") || "").toString(),
      emoji: (formData.get("emoji") || "").toString(),
      color: (formData.get("color") || "#10b981").toString(),
    };

    const result = categorySchema.safeParse(rawData);
    if (!result.success) {
      return { error: firstError(result) };
    }

    const { name, emoji, color } = result.data;

    // Case-insensitive duplicate check, so "Travel" and "travel"
    // can't both exist
    const existing = await prisma.category.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        OR: [{ isDefault: true }, { userId }],
      },
      select: { id: true },
    });

    if (existing) {
      return { error: "A category with this name already exists" };
    }

    await prisma.category.create({
      data: { name, emoji, color, isDefault: false, userId },
    });

    refresh();
    return { success: true };
  } catch (err) {
    console.error("addCustomCategory error:", err);
    return { error: "Could not add the category" };
  }
}

// ===== DELETE CUSTOM CATEGORY =====
// Only the user's own categories, and only when nothing references them
export async function deleteCustomCategory(categoryId) {
  try {
    const userId = await requireUserId();

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId, isDefault: false },
      select: { id: true },
    });

    if (!category) {
      return { error: "This category cannot be deleted" };
    }

    const [expenseCount, budgetCount] = await Promise.all([
      prisma.expense.count({ where: { categoryId, userId } }),
      prisma.budget.count({ where: { categoryId, userId } }),
    ]);

    if (expenseCount > 0 || budgetCount > 0) {
      return {
        error: `This category has ${expenseCount} expense(s) and ${budgetCount} budget(s) — remove those first`,
      };
    }

    await prisma.category.delete({ where: { id: categoryId } });

    refresh();
    return { success: true };
  } catch (err) {
    console.error("deleteCustomCategory error:", err);
    return { error: "Could not delete the category" };
  }
}
