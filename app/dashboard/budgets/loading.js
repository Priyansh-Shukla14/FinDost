// Budgets loading state — see the note in ../expenses/loading.js

export default function BudgetsLoading() {
  return (
    <div>
      <div className="page-header">
        <div style={{ width: "100%" }}>
          <div className="skeleton" style={{ height: "28px", width: "180px" }} />
          <div
            className="skeleton"
            style={{ height: "14px", width: "320px", marginTop: "10px" }}
          />
        </div>
      </div>

      <div className="stat-cards-grid" style={{ marginBottom: "24px" }}>
        {[0, 1, 2].map((i) => (
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

      <div className="card" style={{ padding: "24px", marginBottom: "24px" }}>
        <div className="skeleton" style={{ height: "16px", width: "160px" }} />
        <div className="budget-cards-grid" style={{ marginTop: "20px" }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton" style={{ height: "120px", width: "100%" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
