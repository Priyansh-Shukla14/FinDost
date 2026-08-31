// Import page loading state — see the note in ../expenses/loading.js

export default function ImportLoading() {
  return (
    <div>
      <div className="page-header">
        <div style={{ width: "100%" }}>
          <div className="skeleton" style={{ height: "28px", width: "220px" }} />
          <div
            className="skeleton"
            style={{ height: "14px", width: "320px", marginTop: "10px" }}
          />
        </div>
      </div>

      <div className="card card-padded">
        <div className="skeleton" style={{ height: "180px", width: "100%" }} />
      </div>
    </div>
  );
}
