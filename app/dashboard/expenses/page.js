// Expenses page — server component
// Shows the expense list with filters, stats and an add button

import { prisma } from "@/lib/prisma";
import { requirePageUserId } from "@/lib/session";
import {
  formatCurrency,
  getCurrentMonthYear,
  getMonthName,
  getMonthRange,
  getISTParts,
} from "@/lib/utils";
import { EXPENSES_PER_PAGE } from "@/lib/constants";
import ExpenseList from "./ExpenseList";
import ExpenseFilters from "./ExpenseFilters";

export const metadata = {
  title: "Expenses — FinDost",
};

// Keep month/year/page inside a safe range — anything can arrive in the URL
function clampInt(value, min, max, fallback) {
  const n = parseInt(value, 10);
  if (!Number.isFinite(n) || n < min || n > max) return fallback;
  return n;
}

export default async function ExpensesPage({ searchParams }) {
  const userId = await requirePageUserId();

  const { month: currentMonth, year: currentYear } = getCurrentMonthYear();
  const month = clampInt(searchParams?.month, 1, 12, currentMonth);
  const year = clampInt(searchParams?.year, 2000, 2100, currentYear);
  const categoryFilter = searchParams?.category || "all";
  const page = clampInt(searchParams?.page, 1, 10000, 1);

  const { start: startOfMonth, end: endOfMonth } = getMonthRange(month, year);

  // One where clause for both the list and the stats — otherwise applying a
  // filter narrowed the list while the stat cards still showed the whole month
  const whereClause = {
    userId,
    date: { gte: startOfMonth, lte: endOfMonth },
  };

  if (categoryFilter !== "all") {
    whereClause.categoryId = categoryFilter;
  }

  const [totals, expenses, categories] = await Promise.all([
    prisma.expense.aggregate({
      where: whereClause,
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.expense.findMany({
      where: whereClause,
      include: { category: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * EXPENSES_PER_PAGE,
      take: EXPENSES_PER_PAGE,
    }),
    prisma.category.findMany({
      where: { OR: [{ isDefault: true }, { userId }] },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    }),
  ]);

  const totalSpent = totals._sum.amount || 0;
  const totalCount = totals._count._all || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / EXPENSES_PER_PAGE));

  // Daily average — for the current month, only over the days so far
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const isCurrentMonth = month === currentMonth && year === currentYear;
  const daysPassed = isCurrentMonth ? getISTParts().day : daysInMonth;
  const dailyAverage = daysPassed > 0 ? Math.round(totalSpent / daysPassed) : 0;

  const activeCategory =
    categoryFilter !== "all"
      ? categories.find((c) => c.id === categoryFilter)
      : null;

  // Serialize for the client components (Date objects can't be passed through)
  const serializedExpenses = expenses.map((e) => ({
    id: e.id,
    amount: e.amount,
    note: e.note,
    date: e.date.toISOString(),
    categoryId: e.categoryId,
    categoryName: e.category.name,
    categoryEmoji: e.category.emoji,
    categoryColor: e.category.color,
  }));

  const serializedCategories = categories.map((c) => ({
    id: c.id,
    name: c.name,
    emoji: c.emoji,
    color: c.color,
    isDefault: c.isDefault,
  }));

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">💸 Expenses</h1>
          <p className="page-subtitle">
            {getMonthName(month)} {year} — keep track of where your money goes
            {activeCategory ? ` · ${activeCategory.emoji} ${activeCategory.name}` : ""}
          </p>
        </div>
      </div>

      {/* Stat cards — these respect the active filter too */}
      <div className="stat-cards-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-card-label">💰 Total Spent</div>
          <div className="stat-card-value">{formatCurrency(totalSpent)}</div>
          <div className="stat-card-change" style={{ color: "var(--text-muted)" }}>
            {activeCategory ? `in ${activeCategory.name}` : `in ${getMonthName(month)}`}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">📝 Transactions</div>
          <div className="stat-card-value">{totalCount}</div>
          <div className="stat-card-change" style={{ color: "var(--text-muted)" }}>
            total entries
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">📊 Daily Average</div>
          <div className="stat-card-value">{formatCurrency(dailyAverage)}</div>
          <div className="stat-card-change" style={{ color: "var(--text-muted)" }}>
            over {daysPassed} days
          </div>
        </div>
      </div>

      {/* Filters + expense list (client components) */}
      <ExpenseFilters
        currentMonth={month}
        currentYear={year}
        categoryFilter={categoryFilter}
        categories={serializedCategories}
      />

      <ExpenseList
        expenses={serializedExpenses}
        categories={serializedCategories}
        page={page}
        totalPages={totalPages}
        totalCount={totalCount}
        perPage={EXPENSES_PER_PAGE}
      />
    </div>
  );
}
