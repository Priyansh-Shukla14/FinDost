"use client";

// 💥 Global error boundary — pehle crash pe Next.js ka default red screen aata tha

import { useEffect } from "react";
import Link from "next/link";

export default function Error({ error, reset }) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="status-page">
      <div className="status-card">
        <div className="status-emoji">😵</div>
        <h1 className="status-title">Kuch gadbad ho gayi</h1>
        <p className="status-desc">
          Ye humari taraf se problem hai, teri nahi. Ek baar dobara try karke dekh.
        </p>
        <div className="status-actions">
          <button onClick={() => reset()} className="btn-primary">
            Dobara try karo
          </button>
          <Link href="/dashboard" className="btn-secondary">
            Dashboard
          </Link>
        </div>
        {error?.digest && (
          <p style={{ marginTop: "20px", fontSize: "0.72rem", color: "var(--text-muted)" }}>
            Error ID: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
