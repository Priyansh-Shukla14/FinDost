// Dashboard — server component (phase 3)
// This month's total, category breakdown, 6-month trend and budget progress

import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { requirePageUserId, getSessionUser } from "@/lib/session";
import {
  formatCurrency,
  formatDate,
  getCurrentMonthYear,
  getMonthName,
  getShortMonthName,
  getMonthRange,
  shiftMonth,
  statusFromPercent,
} from "@/lib/utils";
import ChartsSection from "./ChartsSection";

// Postgres SUM()/COUNT() come back as BigInt, which React cannot serialize
const num = (value) => Number(value ?? 0);

export default async function DashboardPage() {
  const [userId, user] = await Promise.all([
    requirePageUserId(),
    getSessionUser(),
  ]);

  const { month, year } = getCurrentMonthYear();
  const { start: startOfMonth, end: endOfMonth } = getMonthRange(month, year);

  const lastMonth = shiftMonth(month, year, -1);

  // The last 6 months, with the current month last
  const trendMonths = [];
  for (let i = 5; i >= 0; i--) {
    let m = month - i;
    let y = year;
    while (m < 1) {
      m += 12;
      y -= 1;
    }
    trendMonths.push({ month: m, year: y });
  }
  const trendStart = getMonthRange(trendMonths[0].month, trendMonths[0].year).start;

  // ===== FETCH DATA =====
  // This used to be 13 separate queries. Each one is a round trip to Neon
  // (~100ms from India), so the page spent over a second just waiting on the
  // network. Two changes fixed it: the six trend aggregates plus both month
  // totals collapse into one grouped query, and the category breakdown joins
  // Category directly instead of fetching the whole table to match IDs in JS.
  // 13 round trips became 4.
  const [monthlyRows, categoryRows, monthlyBudgets, recentExpenses] =
    await Promise.all([
      // One row per month across the whole 6-month window.
      // "date" is TIMESTAMP(3) holding UTC midnight, and getMonthRange() builds
      // its boundaries in UTC too, so date_trunc needs no timezone conversion.
      prisma.$queryRaw`
        SELECT date_trunc('month', "date") AS month_start,
               SUM("amount")::bigint       AS total,
               COUNT(*)::bigint            AS txn_count
        FROM "Expense"
        WHERE "userId" = ${userId}
          AND "date" >= ${trendStart}
          AND "date" <= ${endOfMonth}
        GROUP BY 1
      `,
      // This month's spend per category, already sorted and carrying the
      // category's own display fields
      prisma.$queryRaw`
        SELECT c."id", c."name", c."emoji", c."color",
               SUM(e."amount")::bigint AS total
        FROM "Expense" e
        JOIN "Category" c ON c."id" = e."categoryId"
        WHERE e."userId" = ${userId}
          AND e."date" >= ${startOfMonth}
          AND e."date" <= ${endOfMonth}
        GROUP BY c."id", c."name", c."emoji", c."color"
        ORDER BY total DESC
      `,
      prisma.budget.findMany({
        where: { userId, month, year },
        include: { category: true },
      }),
      prisma.expense.findMany({
        where: { userId },
        include: { category: true },
        orderBy: [{ date: "desc" }, { createdAt: "desc" }],
        take: 5,
      }),
    ]);

  // ===== DERIVE =====
  // month_start is the UTC midnight of the 1st — key it back to month/year
  const byMonth = new Map(
    monthlyRows.map((row) => {
      const d = new Date(row.month_start);
      return [`${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`, row];
    })
  );
  const rowFor = (m, y) => byMonth.get(`${y}-${m}`);

  const totalSpent = num(rowFor(month, year)?.total);
  const expenseCount = num(rowFor(month, year)?.txn_count);
  const lastSpent = num(rowFor(lastMonth.month, lastMonth.year)?.total);

  const totalBudget = monthlyBudgets.reduce((sum, b) => sum + b.amount, 0);
  const budgetLeft = totalBudget - totalSpent;
  const spendChange =
    lastSpent > 0 ? Math.round(((totalSpent - lastSpent) / lastSpent) * 100) : 0;

  const categoryData = categoryRows.map((c) => ({
    name: c.name,
    emoji: c.emoji,
    color: c.color,
    amount: num(c.total),
  }));

  const spentByCategoryId = new Map(
    categoryRows.map((c) => [c.id, num(c.total)])
  );

  const budgetStatus = monthlyBudgets
    .map((budget) => {
      const spent = spentByCategoryId.get(budget.categoryId) || 0;
      const percent =
        budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
      return {
        categoryName: budget.category.name,
        emoji: budget.category.emoji,
        budgetAmount: budget.amount,
        spentAmount: spent,
        percent,
        status: statusFromPercent(percent),
      };
    })
    .sort((a, b) => b.percent - a.percent);

  const trendData = trendMonths.map((t) => ({
    label: `${getShortMonthName(t.month)} ${String(t.year).slice(2)}`,
    amount: num(rowFor(t.month, t.year)?.total) / 100, // paise → rupees
  }));

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Welcome back, {user?.name?.split(" ")[0] || "there"} 👋
          </h1>
          <p className="page-subtitle">
            {getMonthName(month)} {year} — here is the full picture of your spending
          </p>
        </div>
        <Link href="/dashboard/expenses" className="btn-primary">
          ＋ Add Expense
        </Link>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards-grid">
        <div className="stat-card">
          <div className="stat-card-label">💸 Spent This Month</div>
          <div className="stat-card-value">{formatCurrency(totalSpent)}</div>
          {lastSpent > 0 ? (
            <div
              className={`stat-card-change ${
                spendChange > 0 ? "negative" : "positive"
              }`}
            >
              {spendChange > 0 ? "↑" : spendChange < 0 ? "↓" : "="}{" "}
              {Math.abs(spendChange)}% vs last month
            </div>
          ) : (
            <div className="stat-card-change" style={{ color: "var(--text-muted)" }}>
              no data for last month
            </div>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-card-label">🎯 Budget Left</div>
          {totalBudget > 0 ? (
            <>
              <div
                className="stat-card-value"
                style={{ color: budgetLeft >= 0 ? "var(--success)" : "var(--danger)" }}
              >
                {formatCurrency(Math.abs(budgetLeft))}
              </div>
              <div className="stat-card-change" style={{ color: "var(--text-muted)" }}>
                {budgetLeft >= 0
                  ? `out of ${formatCurrency(totalBudget)} — you're on track ✅`
                  : "budget exceeded! ⚠️"}
              </div>
            </>
          ) : (
            <>
              <div className="stat-card-value" style={{ color: "var(--text-muted)" }}>
                —
              </div>
              <div className="stat-card-change" style={{ color: "var(--text-muted)" }}>
                <Link href="/dashboard/budgets" style={{ color: "var(--accent)" }}>
                  set a budget →
                </Link>
              </div>
            </>
          )}
        </div>

        <div className="stat-card">
          <div className="stat-card-label">📝 Transactions</div>
          <div className="stat-card-value">{expenseCount}</div>
          <div className="stat-card-change" style={{ color: "var(--text-muted)" }}>
            this month
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-label">🏆 Top Category</div>
          <div className="stat-card-value" style={{ fontSize: "1.35rem" }}>
            {categoryData[0]
              ? `${categoryData[0].emoji} ${categoryData[0].name}`
              : "—"}
          </div>
          <div className="stat-card-change" style={{ color: "var(--text-muted)" }}>
            {categoryData[0]
              ? formatCurrency(categoryData[0].amount)
              : "No data yet"}
          </div>
        </div>
      </div>

      {/* Charts */}
      <ChartsSection
        categoryData={categoryData.map((c) => ({
          ...c,
          amount: c.amount / 100, // paise → rupees (for display)
        }))}
        trendData={trendData}
      />

      {/* Budget Progress + Recent Expenses */}
      <div className="dashboard-grid-2">
        {/* Budget Progress */}
        <div className="card card-padded">
          <h3 className="panel-title">🎯 Budget Progress</h3>
          {budgetStatus.length === 0 ? (
            <div className="empty-state" style={{ padding: "32px 16px" }}>
              <div className="empty-state-icon">🎯</div>
              <div className="empty-state-title">No budgets set yet</div>
              <div className="empty-state-desc">
                Head to the{" "}
                <Link href="/dashboard/budgets" style={{ color: "var(--accent)" }}>
                  Budgets page
                </Link>{" "}
                to set one up!
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {budgetStatus.map((b) => (
                <div key={b.categoryName}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "6px",
                    }}
                  >
                    <span style={{ fontSize: "0.85rem", fontWeight: 500 }}>
                      {b.emoji} {b.categoryName}
                    </span>
                    <span className={`pill ${b.status}`}>{b.percent}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div
                      className={`progress-bar-fill ${b.status}`}
                      style={{ width: `${Math.min(b.percent, 100)}%` }}
                    />
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginTop: "4px",
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                    }}
                  >
                    <span>{formatCurrency(b.spentAmount)} spent</span>
                    <span>{formatCurrency(b.budgetAmount)} budget</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        <div className="card card-padded">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <h3 className="panel-title" style={{ marginBottom: 0 }}>
              💸 Recent Expenses
            </h3>
            <Link
              href="/dashboard/expenses"
              style={{ fontSize: "0.8rem", color: "var(--accent)", fontWeight: 600 }}
            >
              View all →
            </Link>
          </div>

          {recentExpenses.length === 0 ? (
            <div className="empty-state" style={{ padding: "32px 16px" }}>
              <div className="empty-state-icon">💸</div>
              <div className="empty-state-title">No expenses yet!</div>
              <div className="empty-state-desc">Add your first one 🚀</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {recentExpenses.map((expense) => (
                <div key={expense.id} className="recent-row">
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "1.3rem" }}>{expense.category.emoji}</span>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        {expense.category.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {expense.note || formatDate(expense.date)}
                      </div>
                    </div>
                  </div>
                  <div className="amount negative" style={{ fontSize: "0.9rem" }}>
                    -{formatCurrency(expense.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
