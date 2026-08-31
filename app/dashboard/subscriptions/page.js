// Subscriptions page — server component
// Saved subscriptions, plus anything in the expense history that looks like
// one and has not been saved yet.

import { prisma } from "@/lib/prisma";
import { requirePageUserId } from "@/lib/session";
import { formatCurrency } from "@/lib/utils";
import { detectSubscriptions, excludeKnown } from "@/lib/subscriptions/detect";
import SubscriptionManager from "./SubscriptionManager";

export const metadata = { title: "Subscriptions — FinDost" };

// How far back to look for repeating charges. Long enough to see three or four
// monthly cycles, short enough that a service cancelled last year stops being
// suggested.
const LOOKBACK_MONTHS = 8;

export default async function SubscriptionsPage() {
  const userId = await requirePageUserId();

  const since = new Date();
  since.setUTCMonth(since.getUTCMonth() - LOOKBACK_MONTHS);
  since.setUTCHours(0, 0, 0, 0);

  const [subscriptions, expenses] = await Promise.all([
    prisma.subscription.findMany({
      where: { userId },
      orderBy: [{ isActive: "desc" }, { nextDueDate: "asc" }],
    }),
    // Only expenses carrying a note can be matched into a series, so the
    // filter happens in the database rather than pulling everything back
    prisma.expense.findMany({
      where: {
        userId,
        date: { gte: since },
        note: { not: null },
      },
      include: { category: { select: { name: true, emoji: true } } },
      orderBy: { date: "asc" },
    }),
  ]);

  const candidates = excludeKnown(
    detectSubscriptions(
      expenses.map((e) => ({
        id: e.id,
        amount: e.amount,
        note: e.note,
        date: e.date,
        categoryName: e.category.name,
        categoryEmoji: e.category.emoji,
      }))
    ),
    subscriptions.map((s) => s.name)
  );

  // Monthly burn — a yearly plan is counted at a twelfth of its price so the
  // number means "what this costs me per month", not "what renews this month"
  const active = subscriptions.filter((s) => s.isActive);
  const monthlyBurn = active.reduce(
    (sum, s) => sum + (s.frequency === "yearly" ? Math.round(s.amount / 12) : s.amount),
    0
  );
  const yearlyBurn = monthlyBurn * 12;

  const nextUp = active
    .slice()
    .sort((a, b) => a.nextDueDate - b.nextDueDate)[0];

  const serialized = subscriptions.map((s) => ({
    id: s.id,
    name: s.name,
    amount: s.amount,
    frequency: s.frequency,
    nextDueDate: s.nextDueDate.toISOString(),
    isActive: s.isActive,
  }));

  const serializedCandidates = candidates.map((c) => ({
    key: c.key,
    name: c.name,
    amount: c.amount,
    frequency: c.frequency,
    categoryName: c.categoryName,
    categoryEmoji: c.categoryEmoji,
    occurrences: c.occurrences,
    averageGapDays: c.averageGapDays,
    confidence: c.confidence,
    nextDueDate: c.nextDueDate.toISOString(),
    lastSeen: c.lastSeen.toISOString(),
  }));

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🔄 Subscriptions</h1>
          <p className="page-subtitle">
            Everything that quietly renews — spotted from your own spending
          </p>
        </div>
      </div>

      <div className="stat-cards-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-card-label">💸 Monthly Burn</div>
          <div className="stat-card-value">{formatCurrency(monthlyBurn)}</div>
          <div className="stat-card-change" style={{ color: "var(--text-muted)" }}>
            {active.length === 0
              ? "nothing tracked yet"
              : `across ${active.length} active ${active.length === 1 ? "subscription" : "subscriptions"}`}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">📅 A Year of This</div>
          <div className="stat-card-value">{formatCurrency(yearlyBurn)}</div>
          <div className="stat-card-change" style={{ color: "var(--text-muted)" }}>
            at the current rate
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">⏭️ Next Due</div>
          <div className="stat-card-value" style={{ fontSize: "1.35rem" }}>
            {nextUp ? nextUp.name : "—"}
          </div>
          <div className="stat-card-change" style={{ color: "var(--text-muted)" }}>
            {nextUp ? formatCurrency(nextUp.amount) : "nothing scheduled"}
          </div>
        </div>
      </div>

      <SubscriptionManager
        subscriptions={serialized}
        candidates={serializedCandidates}
      />
    </div>
  );
}
