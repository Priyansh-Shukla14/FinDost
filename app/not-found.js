import Link from "next/link";

export const metadata = { title: "Page not found — FinDost" };

export default function NotFound() {
  return (
    <div className="status-page">
      <div className="status-card">
        <div className="status-emoji">🧐</div>
        <h1 className="status-title">404 — this page went missing</h1>
        <p className="status-desc">
          The link you opened doesn&apos;t exist, or it may have been removed.
        </p>
        <div className="status-actions">
          <Link href="/dashboard" className="btn-primary">
            Go to dashboard
          </Link>
          <Link href="/" className="btn-secondary">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
