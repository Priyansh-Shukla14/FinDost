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
  { name: "Dream Goals", href: "/dashboard/goals", icon: "🌟" },
  { name: "80C Tax Saver", href: "/dashboard/tax", icon: "📋" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      {menuItems.map((item, i) => {
        if (item.section) {
          return (
            <div key={i} className="sidebar-section-title">
              {item.section}
            </div>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`sidebar-link ${pathname === item.href ? "active" : ""}`}
          >
            <span style={{ fontSize: "1.1rem" }}>{item.icon}</span>
            {item.name}
          </Link>
        );
      })}

      {/* Pro upgrade card */}
      <div
        style={{
          marginTop: "auto",
          padding: "20px 16px",
          position: "absolute",
          bottom: "16px",
          left: "16px",
          right: "16px",
        }}
      >
        <div
          className="glass-card"
          style={{
            padding: "20px",
            background: "var(--gradient-card)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: "1.5rem", marginBottom: "8px" }}>✨</div>
          <div
            style={{
              fontSize: "0.85rem",
              fontWeight: 700,
              marginBottom: "6px",
            }}
          >
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
            style={{ padding: "8px 20px", fontSize: "0.8rem", width: "100%" }}
          >
            ₹99/month
          </Link>
        </div>
      </div>
    </aside>
  );
}
