// 🚧 Coming Soon — abhi tak Phase 3 tak hi bana hai
// Sidebar ke jo links aage ke phases ke hain, wo 404 dete the.
// Ab wo yahan aate hain — page dead nahi lagta aur roadmap bhi dikh jaati hai.

import Link from "next/link";

export default function ComingSoon({ icon, title, phase, description, points = [] }) {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {icon} {title}
          </h1>
          <p className="page-subtitle">{phase} mein aa raha hai</p>
        </div>
        <span className="pill info">🚧 Under construction</span>
      </div>

      <div className="card soon-hero">
        <div className="soon-icon">{icon}</div>
        <h2 className="soon-title">{title} abhi ban raha hai</h2>
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
            ← Dashboard pe wapas
          </Link>
        </div>
      </div>
    </div>
  );
}
