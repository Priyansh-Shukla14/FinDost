"use client";

// 🎯 Budget Form — Set/Update budgets per category
// Quick-set buttons + inline editing + month navigation

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setBudget, deleteBudget } from "@/lib/actions/budget";
import { getMonthName, shiftMonth } from "@/lib/utils";

const QUICK_AMOUNTS = [500, 1000, 2000, 5000, 10000];

export default function BudgetForm({ categories, existingBudgets, month, year }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(null); // categoryId being saved
  const [toast, setToast] = useState(null);
  const [amounts, setAmounts] = useState(() => {
    // Initialize with existing budget amounts (paise → rupees)
    const initial = {};
    existingBudgets.forEach((b) => {
      initial[b.categoryId] = b.budgetAmount > 0 ? (b.budgetAmount / 100).toString() : "";
    });
    return initial;
  });

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function goMonth(direction) {
    const next = shiftMonth(month, year, direction);
    const params = new URLSearchParams(searchParams.toString());
    params.set("month", String(next.month));
    params.set("year", String(next.year));
    router.push(`/dashboard/budgets?${params.toString()}`);
  }

  async function handleSave(categoryId) {
    const amount = parseFloat(amounts[categoryId]);
    if (!amount || amount <= 0) {
      showToast("Valid amount dalo!", "error");
      return;
    }

    setLoading(categoryId);

    const formData = new FormData();
    formData.set("amount", amount.toString());
    formData.set("categoryId", categoryId);
    formData.set("month", month.toString());
    formData.set("year", year.toString());

    const result = await setBudget(formData);
    setLoading(null);

    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast("Budget set ho gaya! 🎯");
    }
  }

  async function handleDelete(budgetId, categoryId) {
    if (!budgetId) return;
    setLoading(categoryId);

    const result = await deleteBudget(budgetId);
    setLoading(null);

    if (result.error) {
      showToast(result.error, "error");
    } else {
      setAmounts((prev) => ({ ...prev, [categoryId]: "" }));
      showToast("Budget hata diya! 🗑️");
    }
  }

  return (
    <>
      <div className="card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
          <h3 style={{ fontSize: "1rem", fontWeight: 700 }}>
            💰 Budget Set Karo
          </h3>

          {/* Month Navigator */}
          <div className="month-navigator">
            <button onClick={() => goMonth(-1)} className="month-nav-btn">←</button>
            <span className="month-nav-label">{getMonthName(month)} {year}</span>
            <button onClick={() => goMonth(1)} className="month-nav-btn">→</button>
          </div>
        </div>

        <div className="budget-set-list">
          {categories.map((cat) => {
            const existing = existingBudgets.find((b) => b.categoryId === cat.id);
            const hasBudget = existing?.budgetAmount > 0;
            const currentAmount = amounts[cat.id] || "";

            return (
              <div key={cat.id} className="budget-set-row">
                <div className="budget-set-cat">
                  <span style={{ fontSize: "1.2rem" }}>{cat.emoji}</span>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{cat.name}</div>
                    {existing?.spent > 0 && (
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        ₹{(existing.spent / 100).toLocaleString("en-IN")} spent
                      </div>
                    )}
                  </div>
                </div>

                <div className="budget-set-input-group">
                  <div className="budget-input-wrap">
                    <span className="budget-input-prefix">₹</span>
                    <input
                      type="number"
                      className="input-field budget-amount-input"
                      placeholder="0"
                      value={currentAmount}
                      onChange={(e) =>
                        setAmounts((prev) => ({ ...prev, [cat.id]: e.target.value }))
                      }
                      min="0"
                      step="100"
                    />
                  </div>

                  {/* Quick amounts */}
                  <div className="budget-quick-amounts">
                    {QUICK_AMOUNTS.map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className={`budget-quick-btn ${currentAmount === amt.toString() ? "active" : ""}`}
                        onClick={() =>
                          setAmounts((prev) => ({ ...prev, [cat.id]: amt.toString() }))
                        }
                      >
                        ₹{amt >= 1000 ? `${amt / 1000}k` : amt}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="budget-set-actions">
                  <button
                    onClick={() => handleSave(cat.id)}
                    className="btn-primary"
                    style={{ padding: "8px 16px", fontSize: "0.8rem" }}
                    disabled={loading === cat.id}
                  >
                    {loading === cat.id ? (
                      <span className="spinner" style={{ width: "14px", height: "14px" }} />
                    ) : hasBudget ? (
                      "Update"
                    ) : (
                      "Set"
                    )}
                  </button>
                  {hasBudget && (
                    <button
                      onClick={() => handleDelete(existing.budgetId, cat.id)}
                      className="btn-icon btn-icon-danger"
                      title="Remove budget"
                      disabled={loading === cat.id}
                      style={{ fontSize: "0.8rem" }}
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`}>
          {toast.type === "success" ? "✅" : "❌"} {toast.message}
        </div>
      )}
    </>
  );
}
