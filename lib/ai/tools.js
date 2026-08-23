// The tools FinBot is allowed to call.
//
// Two rules hold for everything in this file:
//   1. Every tool is read-only. Nothing here creates, updates or deletes.
//   2. userId is passed in by the server from the session. The model can ask
//      for a month or a limit, but it can never choose whose data is read.
//
// The queries deliberately mirror the ones the dashboard uses, so FinBot's
// answers and the dashboard always agree.

import { Type } from "@google/genai";
import { prisma } from "@/lib/prisma";
import { getCurrentMonthYear, getMonthRange, getMonthName, toRupees } from "@/lib/utils";

// Month and year are optional on every tool; when the model omits them we
// fall back to the current month in IST.
const monthYearProperties = {
  month: {
    type: Type.INTEGER,
    description: "Month as a number from 1 to 12. Omit to use the current month.",
  },
  year: {
    type: Type.INTEGER,
    description: "Four digit year, for example 2026. Omit to use the current year.",
  },
};

export const toolDeclarations = [
  {
    name: "get_monthly_total",
    description:
      "Total amount the user spent in a given month, along with the number of transactions. Use this for questions like how much did I spend this month.",
    parameters: { type: Type.OBJECT, properties: monthYearProperties },
  },
  {
    name: "get_spend_by_category",
    description:
      "How much the user spent in each category for a given month, sorted from highest to lowest. Use this for questions about a specific category, or about which category they spend the most on.",
    parameters: { type: Type.OBJECT, properties: monthYearProperties },
  },
  {
    name: "get_budget_status",
    description:
      "The user's budgets for a given month with the amount spent against each one and the percentage used. Use this for questions about budgets or overspending.",
    parameters: { type: Type.OBJECT, properties: monthYearProperties },
  },
  {
    name: "get_recent_transactions",
    description:
      "The user's most recent expenses, newest first. Use this for questions about recent or last spending.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        limit: {
          type: Type.INTEGER,
          description: "How many transactions to return, between 1 and 20. Defaults to 10.",
        },
      },
    },
  },
  {
    name: "compare_months",
    description:
      "Compares the user's total spending across the last few months. Use this for questions about trends, or whether spending went up or down.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        months: {
          type: Type.INTEGER,
          description: "How many months to include, between 2 and 12. Defaults to 6.",
        },
      },
    },
  },
];

// Clamp whatever the model sends to something sane before it reaches the database
function resolveMonthYear(args = {}) {
  const current = getCurrentMonthYear();
  const month = Number.isInteger(args.month) && args.month >= 1 && args.month <= 12
    ? args.month
    : current.month;
  const year = Number.isInteger(args.year) && args.year >= 2000 && args.year <= 2100
    ? args.year
    : current.year;
  return { month, year };
}

function clamp(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(max, Math.max(min, Math.round(n)));
}

async function getMonthlyTotal(args, userId) {
  const { month, year } = resolveMonthYear(args);
  const { start, end } = getMonthRange(month, year);

  const result = await prisma.expense.aggregate({
    where: { userId, date: { gte: start, lte: end } },
    _sum: { amount: true },
    _count: { _all: true },
  });

  return {
    month: `${getMonthName(month)} ${year}`,
    total_rupees: toRupees(result._sum.amount || 0),
    transaction_count: result._count._all || 0,
  };
}

async function getSpendByCategory(args, userId) {
  const { month, year } = resolveMonthYear(args);
  const { start, end } = getMonthRange(month, year);

  const [grouped, categories] = await Promise.all([
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: { userId, date: { gte: start, lte: end } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.category.findMany({
      where: { OR: [{ isDefault: true }, { userId }] },
      select: { id: true, name: true },
    }),
  ]);

  const categoryNameById = new Map(categories.map((c) => [c.id, c.name]));

  const rows = grouped
    .map((g) => ({
      category: categoryNameById.get(g.categoryId) || "Other",
      spent_rupees: toRupees(g._sum.amount || 0),
      transaction_count: g._count._all || 0,
    }))
    .sort((a, b) => b.spent_rupees - a.spent_rupees);

  return { month: `${getMonthName(month)} ${year}`, categories: rows };
}

async function getBudgetStatus(args, userId) {
  const { month, year } = resolveMonthYear(args);
  const { start, end } = getMonthRange(month, year);

  const [budgets, grouped] = await Promise.all([
    prisma.budget.findMany({
      where: { userId, month, year },
      include: { category: { select: { name: true } } },
    }),
    prisma.expense.groupBy({
      by: ["categoryId"],
      where: { userId, date: { gte: start, lte: end } },
      _sum: { amount: true },
    }),
  ]);

  const spentByCategory = new Map(
    grouped.map((g) => [g.categoryId, g._sum.amount || 0])
  );

  const rows = budgets.map((b) => {
    const spent = spentByCategory.get(b.categoryId) || 0;
    return {
      category: b.category.name,
      budget_rupees: toRupees(b.amount),
      spent_rupees: toRupees(spent),
      percent_used: b.amount > 0 ? Math.round((spent / b.amount) * 100) : 0,
    };
  });

  return {
    month: `${getMonthName(month)} ${year}`,
    budgets: rows,
    has_budgets: rows.length > 0,
  };
}

async function getRecentTransactions(args, userId) {
  const limit = clamp(args?.limit, 1, 20, 10);

  const expenses = await prisma.expense.findMany({
    where: { userId },
    include: { category: { select: { name: true } } },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    take: limit,
  });

  return {
    transactions: expenses.map((e) => ({
      date: e.date.toISOString().split("T")[0],
      category: e.category.name,
      amount_rupees: toRupees(e.amount),
      note: e.note || null,
    })),
  };
}

async function compareMonths(args, userId) {
  const count = clamp(args?.months, 2, 12, 6);
  const current = getCurrentMonthYear();

  const targets = [];
  for (let i = count - 1; i >= 0; i--) {
    let m = current.month - i;
    let y = current.year;
    while (m < 1) {
      m += 12;
      y -= 1;
    }
    targets.push({ month: m, year: y });
  }

  const totals = await Promise.all(
    targets.map((t) => {
      const { start, end } = getMonthRange(t.month, t.year);
      return prisma.expense.aggregate({
        where: { userId, date: { gte: start, lte: end } },
        _sum: { amount: true },
      });
    })
  );

  return {
    months: targets.map((t, i) => ({
      month: `${getMonthName(t.month)} ${t.year}`,
      total_rupees: toRupees(totals[i]._sum.amount || 0),
    })),
  };
}

const executors = {
  get_monthly_total: getMonthlyTotal,
  get_spend_by_category: getSpendByCategory,
  get_budget_status: getBudgetStatus,
  get_recent_transactions: getRecentTransactions,
  compare_months: compareMonths,
};

/**
 * Runs a tool the model asked for. The name is checked against the allow-list
 * above, so a hallucinated tool name returns an error instead of throwing.
 */
export async function runTool(name, args, userId) {
  const executor = executors[name];
  if (!executor) {
    return { error: `Unknown tool: ${name}` };
  }

  try {
    return await executor(args || {}, userId);
  } catch (err) {
    console.error(`FinBot tool "${name}" failed:`, err);
    return { error: "Could not read that data right now." };
  }
}
