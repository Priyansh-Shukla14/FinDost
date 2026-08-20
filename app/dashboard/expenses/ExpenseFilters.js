"use client";

// Expense filters — month/year navigation plus a category filter.
// Filter state lives in the URL search params so it can be shared.

import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentMonthYear, getShortMonthName, shiftMonth } from "@/lib/utils";

export default function ExpenseFilters({
  currentMonth,
  currentYear,
  categoryFilter,
  categories,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const today = getCurrentMonthYear();
  const isThisMonth = currentMonth === today.month && currentYear === today.year;

  function push(params) {
    // A changed filter goes back to page 1, otherwise "page 3" shows an
    // empty list
    params.delete("page");
    const qs = params.toString();
    router.push(`/dashboard/expenses${qs ? `?${qs}` : ""}`);
  }

  function updateFilter(key, value) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all" || !value) params.delete(key);
    else params.set(key, value);
    push(params);
  }

  function goMonth(direction) {
    const next = shiftMonth(currentMonth, currentYear, direction);
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", String(next.month));
    params.set("year", String(next.year));
    push(params);
  }

  function goToday() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("month");
    params.delete("year");
    push(params);
  }

  return (
    <div className="expense-filters-bar">
      {/* Month navigator */}
      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
        <div className="month-navigator">
          <button
            onClick={() => goMonth(-1)}
            className="month-nav-btn"
            aria-label="Previous month"
          >
            ←
          </button>
          <span className="month-nav-label">
            {getShortMonthName(currentMonth)} {currentYear}
          </span>
          <button
            onClick={() => goMonth(1)}
            className="month-nav-btn"
            aria-label="Next month"
            disabled={
              currentYear > today.year ||
              (currentYear === today.year && currentMonth >= today.month)
            }
          >
            →
          </button>
        </div>

        {!isThisMonth && (
          <button type="button" className="filter-chip" onClick={goToday}>
            ↩ Back to this month
          </button>
        )}
      </div>

      {/* Category filter */}
      <select
        className="select-field"
        style={{ width: "auto", minWidth: "180px" }}
        value={categoryFilter}
        onChange={(e) => updateFilter("category", e.target.value)}
        aria-label="Filter by category"
      >
        <option value="all">🏷️ All Categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.emoji} {cat.name}
          </option>
        ))}
      </select>
    </div>
  );
}
