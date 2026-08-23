// Daily cap on AI requests per user.
//
// The count lives on the User row (aiMessages / aiResetDate) and rolls over
// on the IST calendar day, matching how the rest of the app decides "today".
//
// This is read-then-increment rather than a single atomic statement, so two
// requests firing at the exact same moment could both slip through. For a
// per-user daily cap that is an acceptable trade; it is a cost guard, not a
// security boundary.

import { prisma } from "@/lib/prisma";
import { getISTParts } from "@/lib/utils";

export const DAILY_LIMITS = {
  free: 20,
  pro: 200,
};

function istDateKey(date) {
  const { year, month, day } = getISTParts(date);
  return `${year}-${month}-${day}`;
}

/**
 * Checks the user's remaining quota and consumes one request.
 * Returns { allowed, limit, used, remaining }.
 */
export async function consumeAIRequest(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, aiMessages: true, aiResetDate: true },
  });

  if (!user) {
    return { allowed: false, limit: 0, used: 0, remaining: 0 };
  }

  const limit = DAILY_LIMITS[user.plan] ?? DAILY_LIMITS.free;

  // A new IST day resets the counter
  const isNewDay = istDateKey(user.aiResetDate) !== istDateKey(new Date());
  const used = isNewDay ? 0 : user.aiMessages;

  if (used >= limit) {
    return { allowed: false, limit, used, remaining: 0 };
  }

  await prisma.user.update({
    where: { id: userId },
    data: isNewDay
      ? { aiMessages: 1, aiResetDate: new Date() }
      : { aiMessages: { increment: 1 } },
  });

  return { allowed: true, limit, used: used + 1, remaining: limit - used - 1 };
}

/**
 * Reads the quota without consuming anything — used to show the counter in the UI.
 */
export async function getAIQuota(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { plan: true, aiMessages: true, aiResetDate: true },
  });

  if (!user) return { limit: 0, used: 0, remaining: 0 };

  const limit = DAILY_LIMITS[user.plan] ?? DAILY_LIMITS.free;
  const isNewDay = istDateKey(user.aiResetDate) !== istDateKey(new Date());
  const used = isNewDay ? 0 : user.aiMessages;

  return { limit, used, remaining: Math.max(0, limit - used) };
}
