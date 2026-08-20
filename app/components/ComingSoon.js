// Coming Soon — the app is built up to phase 3 so far.
// Sidebar links belonging to later phases used to 404. They land here
// instead, so the page doesn't feel dead and the roadmap stays visible.

import Link from "next/link";

export default function ComingSoon({ icon, title, phase, description, points = [] }) {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {icon} {title}
          </h1>
          <p className="page-subtitle">Arriving in {phase}</p>
        </div>
        <span className="pill info">🚧 Under construction</span>
      </div>

      <div className="card soon-hero">
        <div className="soon-icon">{icon}</div>
        <h2 className="soon-title">{title} is being built</h2>
        <p className="soon-desc">{description}</p>

        {points.length > 0 && (
          <div className="soon-list">
            {points.map((point) => (
              <div key={point} className="soon-list-item">
                <span style={{ color: "var(--accent)", fontWeight: 700 }}>✓</span>
                <span>{point}</span>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: "28px" }}>
          <Link href="/dashboard" className="btn-secondary">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
