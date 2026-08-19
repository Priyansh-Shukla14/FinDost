// ⏳ Dashboard Loading — server component fetch hone tak skeleton
// Pehle page navigate karte waqt bilkul blank rehta tha.

export default function DashboardLoading() {
  return (
    <div>
      <div className="page-header">
        <div style={{ width: "100%" }}>
          <div className="skeleton" style={{ height: "28px", width: "240px" }} />
          <div
            className="skeleton"
            style={{ height: "14px", width: "320px", marginTop: "10px" }}
          />
        </div>
      </div>

      <div className="stat-cards-grid">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="stat-card">
            <div className="skeleton" style={{ height: "12px", width: "60%" }} />
            <div
              className="skeleton"
              style={{ height: "28px", width: "80%", marginTop: "12px" }}
            />
            <div
              className="skeleton"
              style={{ height: "10px", width: "50%", marginTop: "10px" }}
            />
          </div>
        ))}
      </div>

      <div className="dashboard-grid-2" style={{ marginTop: 0 }}>
        {[0, 1].map((i) => (
          <div key={i} className="card card-padded">
            <div className="skeleton" style={{ height: "16px", width: "180px" }} />
            <div
              className="skeleton"
              style={{ height: "240px", width: "100%", marginTop: "20px" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
