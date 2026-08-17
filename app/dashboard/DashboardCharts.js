"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from "recharts";

const COLORS = [
  "#10b981", "#0ea5e9", "#8b5cf6", "#f59e0b",
  "#ef4444", "#ec4899", "#14b8a6", "#f97316",
  "#6366f1", "#84cc16",
];

// Custom tooltip for chart
function CustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          background: "rgba(15, 23, 42, 0.95)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "8px",
          padding: "12px 16px",
          fontSize: "0.85rem",
        }}
      >
        <p style={{ fontWeight: 600 }}>
          {payload[0].payload.emoji} {payload[0].name}
        </p>
        <p style={{ color: "#10b981", marginTop: "4px" }}>
          ₹{payload[0].value.toLocaleString("en-IN")}
        </p>
      </div>
    );
  }
  return null;
}

export default function DashboardCharts({ categoryData }) {
  if (!categoryData || categoryData.length === 0) {
    return (
      <div className="glass-card" style={{ padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📊</div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>
          Abhi charts ke liye data nahi hai
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Kuch expenses add karo — phir yahan sundar charts dikhenge! 🎨
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card" style={{ padding: "24px" }}>
      <h3 style={{ fontSize: "1rem", fontWeight: 700, marginBottom: "20px" }}>
        📊 Category Breakdown — Is Mahine
      </h3>
      <div style={{ display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap" }}>
        <div style={{ width: "280px", height: "280px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={110}
                paddingAngle={3}
                dataKey="amount"
                nameKey="name"
                animationBegin={0}
                animationDuration={800}
              >
                {categoryData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || COLORS[index % COLORS.length]}
                    stroke="transparent"
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "10px" }}>
          {categoryData.slice(0, 6).map((cat, index) => (
            <div
              key={cat.name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: cat.color || COLORS[index % COLORS.length],
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: "0.85rem", flex: 1 }}>
                {cat.emoji} {cat.name}
              </span>
              <span style={{ fontSize: "0.85rem", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
                ₹{cat.amount.toLocaleString("en-IN")}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
