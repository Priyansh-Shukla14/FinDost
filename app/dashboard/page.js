import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatCurrency, getCurrentMonthYear, getMonthName } from "@/lib/utils";
import DashboardCharts from "./DashboardCharts";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const userId = session.user.id;
  const { month, year } = getCurrentMonthYear();

  // Start and end of current month
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  // ===== FETCH DATA =====

  // Total spent this month
  const monthlyTotal = await prisma.expense.aggregate({
    where: {
      userId,
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    _sum: { amount: true },
  });

  // Total budget this month
  const monthlyBudgets = await prisma.budget.findMany({
    where: { userId, month, year },
    include: { category: true },
  });

  const totalBudget = monthlyBudgets.reduce((sum, b) => sum + b.amount, 0);

  // Spend by category this month
  const categorySpend = await prisma.expense.groupBy({
    by: ["categoryId"],
    where: {
      userId,
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    _sum: { amount: true },
  });

  // Get category details
  const categories = await prisma.category.findMany({
    where: {
      OR: [{ isDefault: true }, { userId }],
    },
  });

  // Map category spend with names
  const categoryData = categorySpend.map((cs) => {
    const cat = categories.find((c) => c.id === cs.categoryId);
    return {
      name: cat?.name || "Other",
      emoji: cat?.emoji || "📦",
      color: cat?.color || "#6b7280",
      amount: cs._sum.amount || 0,
    };
  }).sort((a, b) => b.amount - a.amount);

  // Recent 5 expenses
  const recentExpenses = await prisma.expense.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { date: "desc" },
    take: 5,
  });

  // Last month total (for comparison)
  const lastMonthStart = new Date(year, month - 2, 1);
  const lastMonthEnd = new Date(year, month - 1, 0, 23, 59, 59);

  const lastMonthTotal = await prisma.expense.aggregate({
    where: {
      userId,
      date: { gte: lastMonthStart, lte: lastMonthEnd },
    },
    _sum: { amount: true },
  });

  // Budget status per category
  const budgetStatus = monthlyBudgets.map((budget) => {
    const spent = categorySpend.find((cs) => cs.categoryId === budget.categoryId)?._sum.amount || 0;
    const percent = budget.amount > 0 ? Math.round((spent / budget.amount) * 100) : 0;
    return {
      categoryName: budget.category.name,
      emoji: budget.category.emoji,
      budgetAmount: budget.amount,
      spentAmount: spent,
      percent,
      status: percent >= 90 ? "danger" : percent >= 70 ? "warning" : "safe",
    };
  });

  // Expense count
  const expenseCount = await prisma.expense.count({
    where: {
      userId,
      date: { gte: startOfMonth, lte: endOfMonth },
    },
  });

  // Prepare data
  const totalSpent = monthlyTotal._sum.amount || 0;
  const lastSpent = lastMonthTotal._sum.amount || 0;
  const spendChange = lastSpent > 0 ? Math.round(((totalSpent - lastSpent) / lastSpent) * 100) : 0;
  const budgetLeft = totalBudget - totalSpent;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">
            Namaste, {session.user.name?.split(" ")[0] || "Dost"} 👋
          </h1>
          <p className="page-subtitle">
            {getMonthName(month)} {year} — Yahan hai teri spending ki poori picture
          </p>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="stat-cards-grid">
        <div className="glass-card stat-card">
          <div className="stat-card-label">💸 Is Mahine Kharch</div>
          <div className="stat-card-value">{formatCurrency(totalSpent)}</div>
          {spendChange !== 0 && (
            <div className={`stat-card-change ${spendChange > 0 ? "negative" : "positive"}`}>
              {spendChange > 0 ? "↑" : "↓"} {Math.abs(spendChange)}% vs last month
            </div>
          )}
        </div>

        <div className="glass-card stat-card">
          <div className="stat-card-label">🎯 Budget Bacha</div>
          <div className="stat-card-value" style={{ color: budgetLeft >= 0 ? "var(--success)" : "var(--danger)" }}>
            {formatCurrency(Math.abs(budgetLeft))}
          </div>
          <div className="stat-card-change" style={{ color: "var(--text-muted)" }}>
            {budgetLeft >= 0 ? "abhi safe hai ✅" : "budget cross ho gaya! ⚠️"}
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-card-label">📝 Transactions</div>
          <div className="stat-card-value">{expenseCount}</div>
          <div className="stat-card-change" style={{ color: "var(--text-muted)" }}>
            is mahine
          </div>
        </div>

        <div className="glass-card stat-card">
          <div className="stat-card-label">🏆 Top Category</div>
          <div className="stat-card-value" style={{ fontSize: "1.4rem" }}>
            {categoryData[0] ? `${categoryData[0].emoji} ${categoryData[0].name}` : "—"}
          </div>
          <div className="stat-card-change" style={{ color: "var(--text-muted)" }}>
            {categoryData[0] ? formatCurrency(categoryData[0].amount) : "No data yet"}
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <DashboardCharts
        categoryData={categoryData.map((c) => ({
          ...c,
          amount: c.amount / 100, // Convert paise to rupees for display
        }))}
      />

      {/* Budget Progress + Recent Expenses */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginTop: "24px" }}>
        {/* Budget Progress */}
        <div className="glass-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "20px" }}>
            🎯 Budget Progress
          </h3>
          {budgetStatus.length === 0 ? (
            <div className="empty-state" style={{ padding: "32px 16px" }}>
              <div className="empty-state-icon">🎯</div>
              <div className="empty-state-title">Koi budget nahi set hai</div>
              <div className="empty-state-desc">Budgets page pe jaake set karo!</div>
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
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {b.percent}%
                    </span>
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
        <div className="glass-card" style={{ padding: "24px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "20px" }}>
            💸 Recent Expenses
          </h3>
          {recentExpenses.length === 0 ? (
            <div className="empty-state" style={{ padding: "32px 16px" }}>
              <div className="empty-state-icon">💸</div>
              <div className="empty-state-title">Abhi koi expense nahi!</div>
              <div className="empty-state-desc">Pehla kharcha add karo 🚀</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "12px",
                    borderRadius: "var(--radius-md)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <span style={{ fontSize: "1.3rem" }}>{expense.category.emoji}</span>
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        {expense.category.name}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {expense.note || new Date(expense.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
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
