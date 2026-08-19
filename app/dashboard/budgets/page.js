// 🎯 Budgets Page — Server Component
// Shows category-wise budgets with progress bars and spending data

import { prisma } from "@/lib/prisma";
import { requirePageUserId } from "@/lib/session";
import {
  formatCurrency,
  getCurrentMonthYear,
  getMonthName,
  getMonthRange,
  statusFromPercent,
} from "@/lib/utils";
import BudgetForm from "./BudgetForm";

export const metadata = {
  title: "Budgets — FinDost",
};

// URL se kuch bhi aa sakta hai — safe range mein rakho
function clampInt(value, min, max, fallback) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n) || n < min || n > max) return fallback;
  return n;
}

export default async function BudgetsPage({ searchParams }) {
  const userId = await requirePageUserId();

  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const month = clampInt(searchParams?.month, 1, 12, currentMonth);
  const year = clampInt(searchParams?.year, 2000, 2100, currentYear);

  const { start: startOfMonth, end: endOfMonth } = getMonthRange(month, year);

  const [categories, budgets, categorySpend] = await Promise.all([
    prisma.category.findMany({
      where: { OR: [{ isDefault: true }, { userId }] },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    }),
    prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: true },
    }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
  ]);

  // Total budget and total spent
  const totalBudget = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = categorySpend.reduce((sum, cs) => sum + (cs._sum.amount || 0), 0);
  const budgetUsed = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Build budget data per category
  const budgetData = categories.map((cat) => {
    const budget = budgets.find((b) => b.categoryId === cat.id);
    const spent = categorySpend.find((cs) => cs.categoryId === cat.id)?._sum.amount || 0;
    const budgetAmount = budget?.amount || 0;
    const percent = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      categoryEmoji: cat.emoji,
      categoryColor: cat.color,
      budgetId: budget?.id || null,
      budgetAmount, // in paise
      spent, // in paise
      percent,
      status: statusFromPercent(percent),
    };
  });

  // Jinpe budget set hai — sabse zyada bhare hue pehle
  const withBudget = budgetData
    .filter((b) => b.budgetAmount > 0)
    .sort((a, b) => b.percent - a.percent);

  const serializedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    color: c.color,
  }));

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">🎯 Budgets</h1>
          <p className="page-subtitle">
            {getMonthName(month)} {year} — Category-wise spending limits set karo
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="stat-cards-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-card-label">🎯 Total Budget</div>
          <div className="stat-card-value">{formatCurrency(totalBudget)}</div>
          <div className="stat-card-change" style={{ color: "var(--text-muted)" }}>
            {withBudget.length} categories mein set
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">💸 Total Spent</div>
          <div className="stat-card-value" style={{ color: budgetUsed >= 90 ? "var(--danger)" : budgetUsed >= 70 ? "var(--warning)" : "var(--text-primary)" }}>
            {formatCurrency(totalSpent)}
          </div>
          <div className="stat-card-change" style={{ color: "var(--text-muted)" }}>
            {budgetUsed}% budget used
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">💰 Budget Bacha</div>
          <div className="stat-card-value" style={{ color: totalBudget - totalSpent >= 0 ? "var(--success)" : "var(--danger)" }}>
            {formatCurrency(Math.abs(totalBudget - totalSpent))}
          </div>
          <div className="stat-card-change" style={{ color: "var(--text-muted)" }}>
            {totalBudget - totalSpent >= 0 ? "safe zone ✅" : "over budget ⚠️"}
          </div>
        </div>
      </div>

      {/* Overall Budget Progress */}
      {totalBudget > 0 && (
        <div className="card" style={{ padding: "20px 24px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: 600 }}>Overall Budget Progress</span>
            <span style={{ fontSize: "0.85rem", fontWeight: 700, color: budgetUsed >= 90 ? "var(--danger)" : budgetUsed >= 70 ? "var(--warning)" : "var(--accent)" }}>
              {budgetUsed}%
            </span>
          </div>
          <div className="progress-bar-bg" style={{ height: "12px" }}>
            <div
              className={`progress-bar-fill ${budgetUsed >= 90 ? "danger" : budgetUsed >= 70 ? "warning" : "safe"}`}
              style={{ width: `${Math.min(budgetUsed, 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Active Budgets */}
      {withBudget.length > 0 && (
        <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "20px" }}>
            📊 Active Budgets
          </h3>
          <div className="budget-cards-grid">
            {withBudget.map((b) => (
              <div key={b.categoryId} className="budget-card-item">
                <div className="budget-card-header">
                  <div className="budget-card-cat">
                    <span className="budget-card-emoji">{b.categoryEmoji}</span>
                    <span className="budget-card-name">{b.categoryName}</span>
                  </div>
                  <div className={`budget-card-percent ${b.status}`}>
                    {b.percent}%
                  </div>
                </div>
                <div className="progress-bar-bg" style={{ margin: "12px 0" }}>
                  <div
                    className={`progress-bar-fill ${b.status}`}
                    style={{ width: `${Math.min(b.percent, 100)}%` }}
                  />
                </div>
                <div className="budget-card-footer">
                  <span>{formatCurrency(b.spent)} spent</span>
                  <span>{formatCurrency(b.budgetAmount)} budget</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Set / Update Budgets */}
      <BudgetForm
        categories={serializedCategories}
        existingBudgets={budgetData.map((b) => ({
          categoryId: b.categoryId,
          budgetId: b.budgetId,
          budgetAmount: b.budgetAmount,
          spent: b.spent,
        }))}
        month={month}
        year={year}
      />
    </div>
  );
}
