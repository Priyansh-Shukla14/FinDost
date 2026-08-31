"use client";

// Subscriptions UI — detected candidates on top, saved subscriptions below.
//
// Detection proposes, the user decides. Nothing here writes anything until a
// button is pressed, and "Not a subscription" is a first-class action rather
// than something to be ignored, because a wrong guess that keeps reappearing
// is worse than no guess at all.

import { useState, useEffect } from "react";
import {
  addSubscription,
  editSubscription,
  deleteSubscription,
  toggleSubscription,
} from "@/lib/actions/subscription";
import { formatCurrency, formatDate, toInputValue, todayInputValue } from "@/lib/utils";

// Dismissals live in localStorage rather than the database.
// Adding them to Postgres would mean a new table and a migration for what is
// really a UI preference, and the cost of getting it wrong is one card
// reappearing on another device — not lost data.
const DISMISSED_KEY = "findost.dismissedSubscriptions";

function loadDismissed() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DISMISSED_KEY);
    return Array.isArray(JSON.parse(raw)) ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function confidenceLabel(confidence) {
  if (confidence >= 85) return { text: "Very likely", cls: "danger" };
  if (confidence >= 70) return { text: "Likely", cls: "warning" };
  return { text: "Possible", cls: "info" };
}

export default function SubscriptionManager({ subscriptions = [], candidates = [] }) {
  const [dismissed, setDismissed] = useState([]);
  const [busyId, setBusyId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [toast, setToast] = useState(null);

  // Read on mount rather than during render — localStorage does not exist on
  // the server, and reading it while rendering would break hydration
  useEffect(() => {
    setDismissed(loadDismissed());
  }, []);

  function showToast(message, type = "success") {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  function dismiss(key) {
    const next = [...new Set([...dismissed, key])];
    setDismissed(next);
    try {
      window.localStorage.setItem(DISMISSED_KEY, JSON.stringify(next));
    } catch {
      // Private browsing can refuse writes; the card still goes for this visit
    }
  }

  async function trackCandidate(candidate) {
    if (busyId) return;
    setBusyId(candidate.key);

    const form = new FormData();
    form.set("name", candidate.name);
    form.set("amount", String(candidate.amount / 100));
    form.set("frequency", candidate.frequency);
    form.set("nextDueDate", candidate.nextDueDate.slice(0, 10));

    const result = await addSubscription(form);
    setBusyId(null);

    if (result.error) showToast(result.error, "error");
    else showToast(`Now tracking ${candidate.name} 🔄`);
  }

  async function handleToggle(subscription) {
    if (busyId) return;
    setBusyId(subscription.id);
    const result = await toggleSubscription(subscription.id, !subscription.isActive);
    setBusyId(null);

    if (result.error) showToast(result.error, "error");
    else showToast(subscription.isActive ? "Paused ⏸️" : "Resumed ▶️");
  }

  async function handleDeleteConfirmed() {
    if (!confirmDelete || busyId) return;
    setBusyId(confirmDelete.id);
    const result = await deleteSubscription(confirmDelete.id);
    setBusyId(null);
    setConfirmDelete(null);

    if (result.error) showToast(result.error, "error");
    else showToast("Subscription removed 🗑️");
  }

  const visibleCandidates = candidates.filter((c) => !dismissed.includes(c.key));

  return (
    <>
      {/* ===== Detected ===== */}
      {visibleCandidates.length > 0 && (
        <div className="card card-padded" style={{ marginBottom: "24px" }}>
          <h3 className="panel-title">🔍 Spotted in your expenses</h3>
          <p
            style={{
              fontSize: "0.82rem",
              color: "var(--text-secondary)",
              marginTop: "-10px",
              marginBottom: "18px",
              lineHeight: 1.55,
            }}
          >
            These charges repeat on a schedule. Nothing is saved until you say so.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {visibleCandidates.map((c) => {
              const label = confidenceLabel(c.confidence);
              return (
                <div key={c.key} className="card" style={{ padding: "16px 18px" }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontSize: "0.95rem", fontWeight: 700 }}>
                        {c.categoryEmoji} {c.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.78rem",
                          color: "var(--text-muted)",
                          marginTop: "5px",
                          lineHeight: 1.6,
                        }}
                      >
                        {formatCurrency(c.amount)} · {c.frequency} · seen{" "}
                        {c.occurrences} times, about every {c.averageGapDays} days
                        <br />
                        last charge {formatDate(c.lastSeen)} · next around{" "}
                        {formatDate(c.nextDueDate)}
                      </div>
                    </div>
                    <span className={`pill ${label.cls}`}>{label.text}</span>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      marginTop: "14px",
                      flexWrap: "wrap",
                    }}
                  >
                    <button
                      className="btn-primary"
                      style={{ padding: "8px 16px", fontSize: "0.82rem" }}
                      onClick={() => trackCandidate(c)}
                      disabled={busyId === c.key}
                    >
                      {busyId === c.key ? (
                        <span className="spinner" style={{ width: "14px", height: "14px" }} />
                      ) : (
                        "＋ Track this"
                      )}
                    </button>
                    <button
                      className="btn-secondary"
                      style={{ padding: "8px 16px", fontSize: "0.82rem" }}
                      onClick={() => dismiss(c.key)}
                      disabled={busyId === c.key}
                    >
                      Not a subscription
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== Saved ===== */}
      <div className="card card-padded">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "20px",
            flexWrap: "wrap",
          }}
        >
          <h3 className="panel-title" style={{ marginBottom: 0 }}>
            🔄 Tracked subscriptions
          </h3>
          <button
            className="btn-primary"
            style={{ padding: "8px 16px", fontSize: "0.82rem" }}
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
          >
            ＋ Add manually
          </button>
        </div>

        {subscriptions.length === 0 ? (
          <div className="empty-state" style={{ padding: "32px 16px" }}>
            <div className="empty-state-icon">🔄</div>
            <div className="empty-state-title">Nothing tracked yet</div>
            <div className="empty-state-desc">
              {candidates.length > 0
                ? "Track one of the suggestions above, or add your own."
                : "Add a few months of expenses with notes like “Netflix”, and the repeats will show up here on their own."}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {subscriptions.map((s) => (
              <div
                key={s.id}
                className="recent-row"
                style={{ opacity: s.isActive ? 1 : 0.55 }}
              >
                <div>
                  <div style={{ fontSize: "0.88rem", fontWeight: 600 }}>
                    {s.name}{" "}
                    {!s.isActive && (
                      <span className="pill info" style={{ marginLeft: "6px" }}>
                        paused
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "3px" }}>
                    {s.frequency} · next {formatDate(s.nextDueDate)}
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div className="amount" style={{ fontSize: "0.9rem", fontWeight: 700 }}>
                    {formatCurrency(s.amount)}
                  </div>
                  <button
                    className="btn-icon"
                    title={s.isActive ? "Pause" : "Resume"}
                    aria-label={`${s.isActive ? "Pause" : "Resume"} ${s.name}`}
                    onClick={() => handleToggle(s)}
                    disabled={busyId === s.id}
                  >
                    {s.isActive ? "⏸️" : "▶️"}
                  </button>
                  <button
                    className="btn-icon"
                    title="Edit"
                    aria-label={`Edit ${s.name}`}
                    onClick={() => {
                      setEditing(s);
                      setShowForm(true);
                    }}
                  >
                    ✏️
                  </button>
                  <button
                    className="btn-icon btn-icon-danger"
                    title="Delete"
                    aria-label={`Delete ${s.name}`}
                    onClick={() => setConfirmDelete(s)}
                    disabled={busyId === s.id}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <SubscriptionForm
          subscription={editing}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
          onSuccess={(message) => {
            setShowForm(false);
            setEditing(null);
            showToast(message);
          }}
        />
      )}

      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div
            className="modal-content"
            style={{ maxWidth: "420px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="modal-title">🗑️ Stop tracking this?</h2>
            <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              <strong>{confirmDelete.name}</strong> — {formatCurrency(confirmDelete.amount)}{" "}
              {confirmDelete.frequency}
              <br />
              Your expenses stay untouched; only the tracking is removed.
            </p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setConfirmDelete(null)}
                disabled={!!busyId}
              >
                Keep it
              </button>
              <button className="btn-danger" onClick={handleDeleteConfirmed} disabled={!!busyId}>
                {busyId ? (
                  <span className="spinner" style={{ width: "16px", height: "16px" }} />
                ) : (
                  "Yes, remove it"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className={`toast ${toast.type}`} role="status">
          {toast.type === "success" ? "✅" : "❌"} {toast.message}
        </div>
      )}
    </>
  );
}

// ===== Add / edit form =====

function SubscriptionForm({ subscription, onClose, onSuccess }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEdit = Boolean(subscription);

  async function handleSubmit(event) {
    event.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");

    const form = new FormData(event.currentTarget);
    const result = isEdit
      ? await editSubscription(subscription.id, form)
      : await addSubscription(form);

    setSaving(false);

    if (result.error) setError(result.error);
    else onSuccess(isEdit ? "Subscription updated ✏️" : "Subscription added 🔄");
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <h2 className="modal-title">
          {isEdit ? "✏️ Edit subscription" : "🔄 Add a subscription"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <label className="form-label" htmlFor="sub-name">
              Name
            </label>
            <input
              id="sub-name"
              name="name"
              className="input-field"
              placeholder="Netflix"
              defaultValue={subscription?.name || ""}
              maxLength={60}
              required
              autoFocus
            />
          </div>

          <div className="form-row">
            <label className="form-label" htmlFor="sub-amount">
              Amount (₹)
            </label>
            <input
              id="sub-amount"
              name="amount"
              type="number"
              step="0.01"
              min="0.01"
              className="input-field"
              placeholder="649"
              defaultValue={subscription ? subscription.amount / 100 : ""}
              required
            />
          </div>

          <div className="form-row">
            <label className="form-label" htmlFor="sub-frequency">
              Renews
            </label>
            <select
              id="sub-frequency"
              name="frequency"
              className="select-field"
              defaultValue={subscription?.frequency || "monthly"}
            >
              <option value="monthly">Every month</option>
              <option value="yearly">Every year</option>
            </select>
          </div>

          <div className="form-row">
            <label className="form-label" htmlFor="sub-due">
              Next due date
            </label>
            <input
              id="sub-due"
              name="nextDueDate"
              type="date"
              className="input-field"
              defaultValue={
                subscription ? toInputValue(subscription.nextDueDate) : todayInputValue()
              }
              required
            />
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? (
                <span className="spinner" style={{ width: "16px", height: "16px" }} />
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Add subscription"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
