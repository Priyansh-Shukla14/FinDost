"use client";

// Dashboard chrome — navbar, sidebar and the main content area.
// On mobile the sidebar is hidden (transform: translateX(-100%)), so the
// open/close state lives here — the CSS had a .sidebar.open rule but
// nothing to toggle it.

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

export default function DashboardChrome({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close the sidebar whenever the page changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  // Close on Escape
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
