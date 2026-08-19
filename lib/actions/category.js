// 🏷️ Category Server Actions
// Get categories (default + user) and add/delete custom ones

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
// Default (system) + user-created categories
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

    // Duplicate check — case-insensitive, taaki "Chai" aur "chai" dono na banein
    const existing = await prisma.category.findFirst({
      where: {
        name: { equals: name, mode: "insensitive" },
        OR: [{ isDefault: true }, { userId }],
      },
      select: { id: true },
    });

    if (existing) {
      return { error: "Ye category naam already exist karta hai" };
    }

    await prisma.category.create({
      data: { name, emoji, color, isDefault: false, userId },
    });

    refresh();
    return { success: true };
  } catch (err) {
    console.error("addCustomCategory error:", err);
    return { error: "Category add nahi ho payi" };
  }
}

// ===== DELETE CUSTOM CATEGORY =====
// Sirf apni banayi hui category, aur tabhi jab uspe koi expense/budget na ho
export async function deleteCustomCategory(categoryId) {
  try {
    const userId = await requireUserId();

    const category = await prisma.category.findFirst({
      where: { id: categoryId, userId, isDefault: false },
      select: { id: true },
    });

    if (!category) {
      return { error: "Ye category delete nahi kar sakte" };
    }

    const [expenseCount, budgetCount] = await Promise.all([
      prisma.expense.count({ where: { categoryId, userId } }),
      prisma.budget.count({ where: { categoryId, userId } }),
    ]);

    if (expenseCount > 0 || budgetCount > 0) {
      return {
        error: `Is category mein ${expenseCount} expense aur ${budgetCount} budget hai — pehle unhe hatao`,
      };
    }

    await prisma.category.delete({ where: { id: categoryId } });

    refresh();
    return { success: true };
  } catch (err) {
    console.error("deleteCustomCategory error:", err);
    return { error: "Category delete nahi ho payi" };
  }
}
