"use client";

// Expense list — shows expenses with edit/delete plus an add button.
// Owns the modal state for ExpenseForm.

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteExpense } from "@/lib/actions/expense";
import { formatCurrency, formatDate } from "@/lib/utils";
import ExpenseForm from "./ExpenseForm";

export default function ExpenseList({
  expenses,
  categories,
  page = 1,
  totalPages = 1,
  totalCount = 0,
  perPage = 25,
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [showForm, setShowForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null); // expense object
  const [deletingId, setDeletingId] = useState(null);
  const [toast, setToast] = useState(null);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function handleAdd() {
    setEditingExpense(null);
    setShowForm(true);
  }

  function handleEdit(expense) {
    setEditingExpense(expense);
    setShowForm(true);
  }

  async function handleDeleteConfirmed() {
    if (!confirmDelete || deletingId) return;

    const expense = confirmDelete;
    setDeletingId(expense.id);

    const result = await deleteExpense(expense.id);

    setDeletingId(null);
    setConfirmDelete(null);

    if (result.error) {
      showToast(result.error, "error");
    } else {
      showToast("Expense deleted! 🗑️");
    }
  }

  function handleFormSuccess(message) {
    setShowForm(false);
    setEditingExpense(null);
    showToast(message);
  }

  function goToPage(nextPage) {
    const params = new URLSearchParams(searchParams.toString());
    if (nextPage <= 1) params.delete("page");
    else params.set("page", String(nextPage));
    const qs = params.toString();
    router.push(`/dashboard/expenses${qs ? `?${qs}` : ""}`);
  }

  const from = totalCount === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, totalCount);

  return (
    <>
      {/* Add button */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
        <button onClick={handleAdd} className="btn-primary" id="add-expense-btn">
          ＋ Add Expense
        </button>
      </div>

      {/* Expense list */}
      <div className="card" style={{ overflow: "hidden" }}>
        {expenses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">💸</div>
            <div className="empty-state-title">No expenses found!</div>
            <div className="empty-state-desc">
              {totalCount > 0
                ? "Nothing on this page — try a different filter or page"
                : "Add your first expense for this month 🚀"}
            </div>
            <button onClick={handleAdd} className="btn-primary" style={{ marginTop: "8px" }}>
              ＋ Add Your First Expense
            </button>
          </div>
        ) : (
          <>
            <div className="expense-items-list">
              {expenses.map((expense) => (
                <div key={expense.id} className="expense-row">
                  <div className="expense-row-left">
                    <div
                      className="expense-cat-icon"
                      style={{ background: `${expense.categoryColor}18` }}
                    >
                      <span>{expense.categoryEmoji}</span>
                    </div>
                    <div className="expense-row-info">
                      <div className="expense-row-category">{expense.categoryName}</div>
                      <div className="expense-row-meta">
                        {expense.note && (
                          <span className="expense-row-note">{expense.note}</span>
                        )}
                        <span className="expense-row-date">{formatDate(expense.date)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="expense-row-right">
                    <div className="expense-row-amount">
                      {formatCurrency(expense.amount)}
                    </div>
                    <div className="expense-row-actions">
                      <button
                        onClick={() => handleEdit(expense)}
                        className="btn-icon"
                        title="Edit"
                        aria-label={`Edit ${expense.categoryName} expense`}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => setConfirmDelete(expense)}
                        className="btn-icon btn-icon-danger"
                        title="Delete"
                        aria-label={`Delete ${expense.categoryName} expense`}
                        disabled={deletingId === expense.id}
                      >
                        {deletingId === expense.id ? (
                          <span className="spinner" style={{ width: "14px", height: "14px" }} />
                        ) : (
                          "🗑️"
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination — the list used to stop at 50 and hide the rest */}
            {totalCount > 0 && (
              <div className="pagination-bar">
                <span className="pagination-info">
                  {from}–{to} of {totalCount} expenses
                </span>
                {totalPages > 1 && (
                  <div className="pagination-actions">
                    <button
                      className="month-nav-btn"
                      onClick={() => goToPage(page - 1)}
                      disabled={page <= 1}
                      aria-label="Previous page"
                    >
                      ←
                    </button>
                    <span className="month-nav-label">
                      {page} / {totalPages}
                    </span>
                    <button
                      className="month-nav-btn"
                      onClick={() => goToPage(page + 1)}
                      disabled={page >= totalPages}
                      aria-label="Next page"
                    >
                      →
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* Expense form modal */}
      {showForm && (
        <ExpenseForm
          expense={editingExpense}
          categories={categories}
          onClose={() => {
            setShowForm(false);
            setEditingExpense(null);
          }}
          onSuccess={handleFormSuccess}
        />
      )}

      {/* Delete confirmation — a single click used to delete straight away */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: "420px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">🗑️ Delete this expense?</h2>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <strong>
                {confirmDelete.categoryEmoji} {confirmDelete.categoryName}
              </strong>{" "}
              — {formatCurrency(confirmDelete.amount)} ({formatDate(confirmDelete.date)})
              <br />
              This cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setConfirmDelete(null)}
                disabled={!!deletingId}
              >
                Keep it
              </button>
              <button
                className="btn-danger"
                onClick={handleDeleteConfirmed}
                disabled={!!deletingId}
              >
                {deletingId ? (
                  <span className="spinner" style={{ width: "16px", height: "16px" }} />
                ) : (
                  "Yes, delete it"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          {toast.type === "success" ? "✅" : "❌"} {toast.message}
        </div>
      )}
    </>
  );
}
