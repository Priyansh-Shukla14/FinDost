"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Landing page pe ye navbar nahi dikhna chahiye
  if (pathname === "/" || pathname === "/login") return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link href="/dashboard" className="navbar-logo">
          <span>💰</span> FinDost
        </Link>

        <div className="navbar-links">
          {session?.user && (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginRight: "8px",
                }}
              >
                {session.user.image && (
                  <img
                    src={session.user.image}
                    alt={session.user.name || "User"}
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      border: "2px solid var(--glass-border)",
                    }}
                  />
                )}
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
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
