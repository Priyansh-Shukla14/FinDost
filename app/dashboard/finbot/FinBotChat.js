"use client";

// FinBot chat UI.
//
// The conversation lives in component state and is sent back with each
// message, so the server action stays stateless. Only the last few turns are
// kept by the action, which is plenty for follow-up questions.

import { useState, useRef, useEffect } from "react";
import { askFinBot } from "@/lib/actions/finbot";

const SUGGESTIONS = [
  "How much did I spend this month?",
  "Which category do I spend the most on?",
  "How are my budgets looking?",
  "Has my spending gone up since last month?",
];

export default function FinBotChat({ quota }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(quota?.remaining ?? null);

  const messagesRef = useRef(null);
  const inputRef = useRef(null);

  // Keep the newest message in view
  useEffect(() => {
    const el = messagesRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  async function send(text) {
    const question = text.trim();
    if (!question || loading) return;

    setError("");
    setInput("");
    setLoading(true);

    // History as it was before this question — the action appends the new one
    const history = messages.map((m) => ({ role: m.role, text: m.text }));
    setMessages((prev) => [...prev, { role: "user", text: question }]);

    const result = await askFinBot(history, question);
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setMessages((prev) => [...prev, { role: "model", text: result.answer }]);
      if (typeof result.remaining === "number") setRemaining(result.remaining);
    }

    inputRef.current?.focus();
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="chat-container" style={{ maxWidth: "760px" }}>
      <div className="chat-messages" ref={messagesRef}>
        {isEmpty && !loading && (
          <div style={{ margin: "auto 0", textAlign: "center", padding: "20px 0" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🤖</div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, marginBottom: "8px" }}>
              Ask me about your spending
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: "0.85rem",
                maxWidth: "420px",
                margin: "0 auto 24px",
                lineHeight: 1.6,
              }}
            >
              I read your actual expenses and budgets to answer — the numbers will
              always match your dashboard.
            </p>

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                justifyContent: "center",
                maxWidth: "520px",
                margin: "0 auto",
              }}
            >
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="filter-chip"
                  onClick={() => send(s)}
                  disabled={loading}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`chat-bubble ${m.role === "user" ? "user" : "bot"}`}>
            {m.text}
          </div>
        ))}

        {loading && (
          <div className="chat-bubble bot" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="spinner" style={{ width: "14px", height: "14px" }} />
            <span style={{ color: "var(--text-muted)" }}>Checking your data...</span>
          </div>
        )}
      </div>

      {error && (
        <div className="form-error" style={{ marginBottom: "10px" }}>
          ❌ {error}
        </div>
      )}

      <form
        className="chat-input-area"
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
      >
        <input
          ref={inputRef}
          type="text"
          className="input-field"
          placeholder="Ask about your spending..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          maxLength={500}
          disabled={loading}
          aria-label="Ask FinBot a question"
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={loading || !input.trim()}
        >
          {loading ? (
            <span className="spinner" style={{ width: "16px", height: "16px" }} />
          ) : (
            "Ask"
          )}
        </button>
      </form>

      {typeof remaining === "number" && (
        <div
          style={{
            fontSize: "0.72rem",
            color: "var(--text-muted)",
            textAlign: "right",
            paddingBottom: "8px",
          }}
        >
          {remaining} of {quota.limit} AI requests left today
        </div>
      )}
    </div>
  );
}
