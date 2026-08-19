"use client";

// 🧱 Dashboard Chrome — Navbar + Sidebar + main content
// Mobile pe sidebar hidden hoti hai (transform: translateX(-100%)), isliye
// yahan open/close state rakhi hai — pehle CSS mein .sidebar.open toh tha
// par usse toggle karne wala koi button hi nahi tha.

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function DashboardChrome({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Page badla toh sidebar band
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Escape se band
  useEffect(() => {
    if (!sidebarOpen) return;
    function onKey(e) {
      if (e.key === "Escape") setSidebarOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sidebarOpen]);

  return (
    <>
      <Navbar
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
      />
      <div className="dashboard-layout">
        <Sidebar open={sidebarOpen} />
        {sidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
        )}
        <main className="main-content">{children}</main>
      </div>
    </>
  );
}
