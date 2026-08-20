"use client";

// Expense form — the add/edit modal.
// The same component serves both modes (edit mode receives an expense prop).

import { useState, useRef, useEffect } from "react";
import { addExpense, editExpense } from "@/lib/actions/expense";
import { addCustomCategory } from "@/lib/actions/category";
import { todayInputValue, toInputValue } from "@/lib/utils";
import { CATEGORY_COLORS } from "@/lib/constants";

const QUICK_AMOUNTS = [20, 50, 100, 500, 1000];

export default function ExpenseForm({ expense, categories, onClose, onSuccess }) {
  const isEdit = !!expense;
  const formRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [amount, setAmount] = useState(
    expense ? (expense.amount / 100).toString() : ""
  );

  // Inline "new category" panel
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", emoji: "🏷️" });
  const [categorySaving, setCategorySaving] = useState(false);

  const defaultCategory = expense?.categoryId || "";
  const defaultDate = expense ? toInputValue(expense.date) : todayInputValue();
  const defaultNote = expense?.note || "";

  // Close the modal on Escape
  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setError("");

    const formData = new FormData(formRef.current);

    const result = isEdit
      ? await editExpense(expense.id, formData)
      : await addExpense(formData);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      onSuccess(isEdit ? "Expense updated! ✏️" : "Expense added! 🎉");
    }
  }

  async function handleAddCategory() {
    if (categorySaving) return;

    setCategorySaving(true);
    setError("");

    const fd = new FormData();
    fd.set("name", newCategory.name);
    fd.set("emoji", newCategory.emoji);
    fd.set(
      "color",
      CATEGORY_COLORS[Math.floor(newCategory.name.length % CATEGORY_COLORS.length)]
    );

    const result = await addCustomCategory(fd);
    setCategorySaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      setShowNewCategory(false);
      setNewCategory({ name: "", emoji: "🏷️" });
      // revalidatePath refreshes the list
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "24px",
          }}
        >
          <h2 className="modal-title" style={{ margin: 0 }}>
            {isEdit ? "✏️ Edit Expense" : "💸 Add a New Expense"}
          </h2>
          <button onClick={onClose} className="btn-icon" aria-label="Close">
            ✕
          </button>
        </div>

        {error && <div className="form-error">❌ {error}</div>}

        <form ref={formRef} onSubmit={handleSubmit}>
          {/* Amount */}
          <div className="form-row">
            <label className="form-label" htmlFor="expense-amount-input">
              💰 Amount (₹)
            </label>
            <input
              type="number"
              name="amount"
              className="input-field"
              placeholder="e.g. 150"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="0.01"
              min="0"
              required
              autoFocus
              id="expense-amount-input"
              inputMode="decimal"
            />
            <div className="budget-quick-amounts" style={{ marginTop: "8px" }}>
              {QUICK_AMOUNTS.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  className={`budget-quick-btn ${amount === amt.toString() ? "active" : ""}`}
                  onClick={() => setAmount(amt.toString())}
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Category */}
          <div className="form-row">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <label className="form-label" htmlFor="expense-category-select">
                🏷️ Category
              </label>
              <button
                type="button"
                onClick={() => setShowNewCategory((v) => !v)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--accent)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  padding: 0,
                  marginBottom: "6px",
                }}
              >
                {showNewCategory ? "Cancel" : "＋ New category"}
              </button>
            </div>

            <select
              name="categoryId"
              className="select-field"
              defaultValue={defaultCategory}
              required
              id="expense-category-select"
            >
              <option value="">-- Choose a category --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.emoji} {cat.name}
                </option>
              ))}
            </select>

            {showNewCategory && (
              <div
                style={{
                  marginTop: "10px",
                  padding: "12px",
                  background: "var(--bg-light)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-md)",
                  display: "flex",
                  gap: "8px",
                }}
              >
                <input
                  type="text"
                  className="input-field"
                  style={{ width: "64px", textAlign: "center" }}
                  value={newCategory.emoji}
                  onChange={(e) =>
                    setNewCategory((p) => ({ ...p, emoji: e.target.value }))
                  }
                  maxLength={4}
                  aria-label="Category emoji"
                />
                <input
                  type="text"
                  className="input-field"
                  style={{ flex: 1 }}
                  placeholder="Category name"
                  value={newCategory.name}
                  onChange={(e) =>
                    setNewCategory((p) => ({ ...p, name: e.target.value }))
                  }
                  maxLength={30}
                  aria-label="Category name"
                />
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: "8px 16px", fontSize: "0.8rem" }}
                  onClick={handleAddCategory}
                  disabled={categorySaving || !newCategory.name.trim()}
                >
                  {categorySaving ? (
                    <span className="spinner" style={{ width: "14px", height: "14px" }} />
                  ) : (
                    "Add"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Date */}
          <div className="form-row">
            <label className="form-label" htmlFor="expense-date-input">
              📅 Date
            </label>
            <input
              type="date"
              name="date"
              className="input-field"
              defaultValue={defaultDate}
              max={todayInputValue()}
              required
              id="expense-date-input"
            />
          </div>

          {/* Note */}
          <div className="form-row">
            <label className="form-label" htmlFor="expense-note-input">
              📝 Note (optional)
            </label>
            <input
              type="text"
              name="note"
              className="input-field"
              placeholder="e.g. Coffee with friends"
              defaultValue={defaultNote}
              maxLength={200}
              id="expense-note-input"
            />
          </div>

          {/* Actions */}
          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              id="expense-submit-btn"
            >
              {loading ? (
                <>
                  <span className="spinner" style={{ width: "16px", height: "16px" }} />
                  Saving...
                </>
              ) : isEdit ? (
                "Update Expense ✏️"
              ) : (
                "Add Expense 🚀"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
