"use client";

// Lazy wrapper around DashboardCharts.
//
// Recharts is around 115 kB of JavaScript — more than the whole rest of the
// dashboard put together, and the build showed /dashboard shipping 211 kB of
// First Load JS against 90 kB for every other page. Loading it eagerly meant
// the browser parsed all of it before painting anything, so the stat cards,
// budget bars and recent expenses (which need no JavaScript at all) sat behind
// the charts.
//
// Splitting it into its own chunk lets the rest of the page paint immediately
// while the chart bundle downloads in the background. ssr: false because
// Recharts measures DOM nodes and cannot render on the server anyway.
//
// next/dynamic with ssr: false only works inside a client component, which is
// why this wrapper exists instead of the option being set in page.js.

import dynamic from "next/dynamic";

const DashboardCharts = dynamic(() => import("./DashboardCharts"), {
  ssr: false,
  loading: () => <ChartsSkeleton />,
});

function ChartsSkeleton() {
  return (
    <div className="dashboard-grid-2" style={{ marginTop: 0 }}>
      {[0, 1].map((i) => (
        <div key={i} className="card card-padded">
          <div className="skeleton" style={{ height: "16px", width: "220px" }} />
          <div
            className="skeleton"
            style={{ height: "240px", width: "100%", marginTop: "20px" }}
          />
        </div>
      ))}
    </div>
  );
}

export default function ChartsSection(props) {
  return <DashboardCharts {...props} />;
}
