// Budget alert job.
//
// Runs once a day from a cron and emails anyone whose spending has crossed
// BUDGET_ALERT_THRESHOLD on a category budget this month.
//
// Two rules shape everything here:
//
//   1. One email per budget per month. Budget rows are unique per
//      (userId, categoryId, month, year), so the alertSent flag lives on the
//      row and resets naturally when next month's budget is created — no
//      separate bookkeeping table, and no way to double-send.
//
//   2. alertSent is only set after the email actually left. A failed send
//      leaves the flag alone so tomorrow's run retries it, which is the right
//      trade: a duplicate email is annoying, a silently swallowed alert
//      defeats the feature.

import { prisma } from "@/lib/prisma";
import { sendEmail, isEmailConfigured } from "@/lib/email/resend";
import { budgetAlertEmail, budgetAlertSubject } from "@/lib/email/templates";
import { BUDGET_ALERT_THRESHOLD } from "@/lib/constants";
import { getCurrentMonthYear, getMonthName, getMonthRange } from "@/lib/utils";

function dashboardUrl() {
  const base =
    process.env.NEXTAUTH_URL?.replace(/\/$/, "") || "http://localhost:3000";
  return `${base}/dashboard/budgets`;
}

/**
 * Finds every budget that has newly crossed the threshold and emails its
 * owner. Returns a summary the cron route can log.
 *
 * `dryRun` computes everything and sends nothing — used by the local test
 * script so it can be run against real data safely.
 */
export async function runBudgetAlerts({ dryRun = false } = {}) {
  const { month, year } = getCurrentMonthYear();
  const { start, end } = getMonthRange(month, year);
  const monthLabel = `${getMonthName(month)} ${year}`;

  const summary = {
    month: monthLabel,
    threshold: BUDGET_ALERT_THRESHOLD,
    budgetsChecked: 0,
    budgetsCrossed: 0,
    emailsSent: 0,
    usersSkippedNoEmail: 0,
    failures: [],
    dryRun,
  };

  if (!dryRun && !isEmailConfigured()) {
    summary.failures.push("RESEND_API_KEY is not configured");
    return summary;
  }

  // Only budgets that have not already alerted this month can produce an email
  const budgets = await prisma.budget.findMany({
    where: { month, year, alertSent: false },
    include: {
      category: { select: { name: true, emoji: true } },
      user: { select: { id: true, email: true, name: true } },
    },
  });

  summary.budgetsChecked = budgets.length;
  if (budgets.length === 0) return summary;

  // Spend per (user, category) for the whole month, for every affected user in
  // one query — the alternative is a query per budget, which is a round trip
  // per budget to a database in another country.
  const userIds = [...new Set(budgets.map((b) => b.userId))];
  const spendRows = await prisma.expense.groupBy({
    by: ["userId", "categoryId"],
    where: { userId: { in: userIds }, date: { gte: start, lte: end } },
    _sum: { amount: true },
  });

  const spentByKey = new Map(
    spendRows.map((r) => [`${r.userId}:${r.categoryId}`, r._sum.amount || 0])
  );

  // Group everything that crossed, per user, so someone who blew three
  // budgets on the same day gets one email instead of three
  const perUser = new Map();

  for (const budget of budgets) {
    if (budget.amount <= 0) continue;

    const spent = spentByKey.get(`${budget.userId}:${budget.categoryId}`) || 0;
    const percent = Math.round((spent / budget.amount) * 100);
    if (percent < BUDGET_ALERT_THRESHOLD) continue;

    summary.budgetsCrossed++;

    if (!perUser.has(budget.userId)) {
      perUser.set(budget.userId, { user: budget.user, crossed: [], budgetIds: [] });
    }
    const entry = perUser.get(budget.userId);
    entry.crossed.push({
      categoryName: budget.category.name,
      emoji: budget.category.emoji,
      budgetAmount: budget.amount,
      spentAmount: spent,
      percent,
    });
    entry.budgetIds.push(budget.id);
  }

  for (const { user, crossed, budgetIds } of perUser.values()) {
    if (!user.email) {
      // Google sign-in always supplies one, but the column is nullable.
      // Leave alertSent untouched so it fires if an address turns up later.
      summary.usersSkippedNoEmail++;
      continue;
    }

    // Worst offender first — it decides the subject line
    crossed.sort((a, b) => b.percent - a.percent);

    if (dryRun) {
      summary.emailsSent++;
      continue;
    }

    const result = await sendEmail({
      to: user.email,
      subject: budgetAlertSubject({ crossed, monthLabel }),
      html: budgetAlertEmail({
        userName: user.name,
        crossed,
        monthLabel,
        dashboardUrl: dashboardUrl(),
      }),
    });

    if (result.sent) {
      await prisma.budget.updateMany({
        where: { id: { in: budgetIds } },
        data: { alertSent: true },
      });
      summary.emailsSent++;
    } else {
      // Flag stays false on purpose — tomorrow's run tries again
      summary.failures.push(`${user.id}: ${result.error}`);
    }
  }

  return summary;
}
