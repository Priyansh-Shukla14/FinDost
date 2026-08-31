"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { section: "Main" },
  { name: "Dashboard", href: "/dashboard", icon: "📊" },
  { name: "Expenses", href: "/dashboard/expenses", icon: "💸" },
  { name: "Budgets", href: "/dashboard/budgets", icon: "🎯" },
  { section: "AI Features" },
  { name: "FinBot", href: "/dashboard/finbot", icon: "🤖" },
  { name: "Receipt Scanner", href: "/dashboard/scanner", icon: "📸" },
  { section: "Tracking" },
  { name: "Subscriptions", href: "/dashboard/subscriptions", icon: "🔄" },
  { name: "Dream Goals", href: "/dashboard/goals", icon: "🌟", soon: true },
  { name: "80C Tax Saver", href: "/dashboard/tax", icon: "📋", soon: true },
];

export default function Sidebar({ open = false }) {
  const pathname = usePathname();

  // /dashboard is active only on an exact match; the rest also match
  // their nested routes
  function isActive(href) {
    return href === "/dashboard"
      ? pathname === href
      : pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
      <nav className="sidebar-nav">
        {menuItems.map((item, i) => {
          if (item.section) {
            return (
              <div key={`section-${i}`} className="sidebar-section-title">
                {item.section}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`sidebar-link ${isActive(item.href) ? "active" : ""}`}
              aria-current={isActive(item.href) ? "page" : undefined}
            >
              <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
              {item.name}
              {item.soon && <span className="sidebar-badge">soon</span>}
            </Link>
          );
        })}
      </nav>

      {/* Pro upgrade card — pinned below the nav list */}
      <div className="sidebar-footer">
        <div className="sidebar-pro-card">
          <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>✨</div>
          <div style={{ fontSize: "0.85rem", fontWeight: 700, marginBottom: "6px" }}>
            Upgrade to Pro
          </div>
          <div
            style={{
              fontSize: "0.75rem",
              color: "var(--text-secondary)",
              marginBottom: "12px",
            }}
          >
            Unlimited FinBot + PDF Reports
          </div>
          <Link
            href="/dashboard/upgrade"
            className="btn-primary"
            style={{
              padding: "8px 20px",
              fontSize: "0.8rem",
              width: "100%",
              justifyContent: "center",
            }}
          >
            ₹99/month
          </Link>
        </div>
      </div>
    </aside>
  );
}
