import Link from "next/link";

export const metadata = { title: "Page nahi mila — FinDost" };

export default function NotFound() {
  return (
    <div className="status-page">
      <div className="status-card">
        <div className="status-emoji">🧐</div>
        <h1 className="status-title">404 — ye page kahin kho gaya</h1>
        <p className="status-desc">
          Jo link tune khola wo exist nahi karta, ya shayad hata diya gaya hai.
        </p>
        <div className="status-actions">
          <Link href="/dashboard" className="btn-primary">
            Dashboard pe jao
          </Link>
          <Link href="/" className="btn-secondary">
            Home
          </Link>
        </div>
      </div>
    </div>
  );
}
