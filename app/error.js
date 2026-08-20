"use client";

// Global error boundary — before this, a crash showed the default Next.js
// red error screen.

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
        <h1 className="status-title">Something went wrong</h1>
        <p className="status-desc">
          This one is on us, not on you. Give it another try.
        </p>
        <div className="status-actions">
          <button onClick={() => reset()} className="btn-primary">
            Try again
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
