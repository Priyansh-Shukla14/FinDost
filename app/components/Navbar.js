"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar({ sidebarOpen = false, onToggleSidebar }) {
  const { data: session } = useSession();

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Mobile menu — sirf chhoti screen pe dikhta hai (CSS) */}
          <button
            type="button"
            className="navbar-menu-btn"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? "Close menu" : "Open menu"}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? "✕" : "☰"}
          </button>

          <Link href="/dashboard" className="navbar-logo">
            <span>💰</span> FinDost
          </Link>
        </div>

        <div className="navbar-links">
          {session?.user && (
            <>
              <div className="navbar-user">
                {session.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="navbar-avatar"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="navbar-avatar navbar-avatar-fallback">
                    {(session.user.name || session.user.email || "U")
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}
                <span className="navbar-user-name">
                  {session.user.name?.split(" ")[0] || "User"}
                </span>
              </div>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="btn-secondary"
                style={{ padding: "6px 16px", fontSize: "0.8rem" }}
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
