"use client";

// Dashboard charts — a category pie and a 6-month trend bar chart.
// Recharts is client-only, so this component is "use client" and the data
// arrives from the server component as serialized props.

import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = [
  "#10b981", "#0ea5e9", "#8b5cf6", "#f59e0b",
  "#ef4444", "#ec4899", "#14b8a6", "#f97316",
  "#6366f1", "#84cc16",
];

const tooltipBox = {
  background: "#ffffff",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
  padding: "10px 14px",
  fontSize: "0.82rem",
  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07)",
};

function rupees(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function CategoryTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div style={tooltipBox}>
      <div style={{ fontWeight: 600, color: "#0f172a" }}>
        {item.payload.emoji} {item.name}
      </div>
      <div style={{ color: "#059669", marginTop: "4px", fontWeight: 700 }}>
        {rupees(item.value)}
      </div>
    </div>
  );
}

function TrendTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipBox}>
      <div style={{ fontWeight: 600, color: "#0f172a" }}>{label}</div>
      <div style={{ color: "#059669", marginTop: "4px", fontWeight: 700 }}>
        {rupees(payload[0].value)}
      </div>
    </div>
  );
}

export default function DashboardCharts({ categoryData = [], trendData = [] }) {
  const hasCategory = categoryData.length > 0;
  const hasTrend = trendData.some((t) => t.amount > 0);

  // Brand new user — both are empty
  if (!hasCategory && !hasTrend) {
    return (
      <div className="card" style={{ padding: "48px 24px", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📊</div>
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "8px" }}>
          No data for charts yet
        </h3>
        <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Add a few expenses and your charts will appear here! 🎨
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-grid-2" style={{ marginTop: 0 }}>
      {/* Category Pie */}
      <div className="card card-padded">
        <h3 className="panel-title">📊 Category Breakdown — This Month</h3>

        {!hasCategory ? (
          <div className="empty-state" style={{ padding: "32px 16px" }}>
            <div className="empty-state-icon">🥧</div>
            <div className="empty-state-title">No spending this month</div>
            <div className="empty-state-desc">That&apos;s good news — unless you forgot to add it 😄</div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
            <div style={{ width: "240px", height: "240px", flexShrink: 0 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={58}
                    outerRadius={100}
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
                  <Tooltip content={<CategoryTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div style={{ flex: 1, minWidth: "180px", display: "flex", flexDirection: "column", gap: "10px" }}>
              {categoryData.slice(0, 6).map((cat, index) => (
                <div key={cat.name} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
                  <span
                    style={{
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {rupees(cat.amount)}
                  </span>
                </div>
              ))}
              {categoryData.length > 6 && (
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                  +{categoryData.length - 6} more categories
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 6-Month Trend */}
      <div className="card card-padded">
        <h3 className="panel-title">📈 Last 6 Months — Total Spending</h3>
        <div style={{ width: "100%", height: "240px" }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#94a3b8" }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : v)}
                width={48}
              />
              <Tooltip content={<TrendTooltip />} cursor={{ fill: "#f8fafc" }} />
              <Bar
                dataKey="amount"
                fill="#10b981"
                radius={[6, 6, 0, 0]}
                animationDuration={800}
                maxBarSize={44}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
