"use client";

// 🔍 Expense Filters — Month/Year navigation + Category filter
// Uses URL search params for shareable filter state

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
    // Filter badla toh page 1 pe wapas — warna "page 3" pe khali list dikhti hai
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
      {/* Month Navigator */}
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
            ↩ Is mahine pe wapas
          </button>
        )}
      </div>

      {/* Category Filter */}
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
