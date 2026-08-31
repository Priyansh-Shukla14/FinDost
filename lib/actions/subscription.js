// Subscription server actions — everything scoped to session.user.id.
//
// Detection only ever proposes. Nothing becomes a Subscription row until the
// user confirms it here, which is why there is no "auto-create detected
// subscriptions" action anywhere in this file.

"use server";

import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { subscriptionSchema, firstError } from "@/lib/validations";
import { revalidatePath } from "next/cache";
import { toPaise, parseDateOnly } from "@/lib/utils";
import { normalizeNote } from "@/lib/subscriptions/detect";

function refresh() {
  revalidatePath("/dashboard/subscriptions");
  revalidatePath("/dashboard");
}

function readForm(formData) {
  return {
    name: (formData.get("name") || "").toString().trim(),
    amount: parseFloat(formData.get("amount")),
    frequency: (formData.get("frequency") || "monthly").toString(),
    nextDueDate: (formData.get("nextDueDate") || "").toString(),
  };
}

// ===== ADD =====
export async function addSubscription(formData) {
  try {
    const userId = await requireUserId();

    const result = subscriptionSchema.safeParse(readForm(formData));
    if (!result.success) {
      return { error: firstError(result) };
    }

    const { name, amount, frequency, nextDueDate } = result.data;

    // Subscription has no unique constraint on (userId, name), so the check
    // has to happen here. Compared on the normalized name so "Netflix" and
    // "netflix " cannot both be saved.
    const existing = await prisma.subscription.findMany({
      where: { userId },
      select: { id: true, name: true },
    });
    const key = normalizeNote(name);
    if (existing.some((s) => normalizeNote(s.name) === key)) {
      return { error: `You are already tracking "${name}".` };
    }

    await prisma.subscription.create({
      data: {
        name,
        amount: toPaise(amount),
        frequency,
        nextDueDate: parseDateOnly(nextDueDate),
        userId,
      },
    });

    refresh();
    return { success: true };
  } catch (err) {
    console.error("addSubscription error:", err);
    return { error: "Could not save that subscription. Please try again." };
  }
}

// ===== EDIT =====
export async function editSubscription(subscriptionId, formData) {
  try {
    const userId = await requireUserId();

    const result = subscriptionSchema.safeParse(readForm(formData));
    if (!result.success) {
      return { error: firstError(result) };
    }

    const { name, amount, frequency, nextDueDate } = result.data;

    // Ownership check and update in one query — same pattern as expenses
    const updated = await prisma.subscription.updateMany({
      where: { id: subscriptionId, userId },
      data: {
        name,
        amount: toPaise(amount),
        frequency,
        nextDueDate: parseDateOnly(nextDueDate),
      },
    });

    if (updated.count === 0) {
      return { error: "Subscription not found, or you don't have access to it" };
    }

    refresh();
    return { success: true };
  } catch (err) {
    console.error("editSubscription error:", err);
    return { error: "Could not update that subscription. Please try again." };
  }
}

// ===== PAUSE / RESUME =====
export async function toggleSubscription(subscriptionId, isActive) {
  try {
    const userId = await requireUserId();

    const updated = await prisma.subscription.updateMany({
      where: { id: subscriptionId, userId },
      data: { isActive: Boolean(isActive) },
    });

    if (updated.count === 0) {
      return { error: "Subscription not found, or you don't have access to it" };
    }

    refresh();
    return { success: true };
  } catch (err) {
    console.error("toggleSubscription error:", err);
    return { error: "Could not update that subscription." };
  }
}

// ===== DELETE =====
export async function deleteSubscription(subscriptionId) {
  try {
    const userId = await requireUserId();

    const deleted = await prisma.subscription.deleteMany({
      where: { id: subscriptionId, userId },
    });

    if (deleted.count === 0) {
      return { error: "Subscription not found, or you don't have access to it" };
    }

    refresh();
    return { success: true };
  } catch (err) {
    console.error("deleteSubscription error:", err);
    return { error: "Could not delete that subscription." };
  }
}
