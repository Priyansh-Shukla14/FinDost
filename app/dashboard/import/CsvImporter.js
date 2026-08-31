"use client";

// CSV import UI — pick a file, map the columns, check the preview, import.
//
// Parsing happens here rather than on the server so the preview updates the
// instant a dropdown changes, with no upload round trip. The server re-checks
// everything anyway (see lib/actions/import.js), so nothing rests on this
// being honest.
//
// The preview is the point of the whole screen. A statement is somebody's
// real money, and a silent import that quietly mangles half the dates is
// much worse than one that shows exactly what it will and will not take.

import { useState, useMemo, useRef } from "react";
import Papa from "papaparse";
import { buildRows, DATE_FORMATS } from "@/lib/csv/rows";
import { importExpenses } from "@/lib/actions/import";
import { formatCurrency, formatDate } from "@/lib/utils";

const PREVIEW_LIMIT = 8;
const MAX_FILE_BYTES = 2 * 1024 * 1024; // 2 MB — far beyond any real statement

// Bank exports name these columns fairly predictably, so the mapping starts
// on a sensible guess instead of four empty dropdowns
const GUESSES = {
  date: ["date", "txn date", "transaction date", "value date", "posted date"],
  amount: ["withdrawal", "debit", "amount", "withdrawal amt", "debit amount", "amt"],
  note: ["narration", "description", "particulars", "remarks", "details", "note"],
  category: ["category", "type", "tag"],
};

function guessColumn(headers, candidates) {
  const lower = headers.map((h) => ({ raw: h, key: h.trim().toLowerCase() }));
  for (const candidate of candidates) {
    const hit = lower.find((h) => h.key === candidate);
    if (hit) return hit.raw;
  }
  // Fall back to a partial match — "Withdrawal Amt." should still find it
  for (const candidate of candidates) {
    const hit = lower.find((h) => h.key.includes(candidate));
    if (hit) return hit.raw;
  }
  return "";
}

export default function CsvImporter({ categories = [] }) {
  const fileRef = useRef(null);

  const [fileName, setFileName] = useState("");
  const [headers, setHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [parseError, setParseError] = useState("");

  const [mapping, setMapping] = useState({ date: "", amount: "", note: "", category: "" });
  const [dateFormat, setDateFormat] = useState("auto");
  const [defaultCategoryId, setDefaultCategoryId] = useState(categories[0]?.id || "");

  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  function reset() {
    setFileName("");
    setHeaders([]);
    setRawRows([]);
    setParseError("");
    setMapping({ date: "", amount: "", note: "", category: "" });
    setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    setResult(null);
    setParseError("");

    if (file.size > MAX_FILE_BYTES) {
      setParseError("That file is over 2 MB. Export a shorter date range and try again.");
      return;
    }

    Papa.parse(file, {
      header: true,
      skipEmptyLines: "greedy",
      complete: (parsed) => {
        const fields = (parsed.meta?.fields || []).filter(Boolean);
        if (fields.length === 0) {
          setParseError("No column headers found. The first row of the file must name the columns.");
          return;
        }

        setFileName(file.name);
        setHeaders(fields);
        setRawRows(parsed.data || []);
        setMapping({
          date: guessColumn(fields, GUESSES.date),
          amount: guessColumn(fields, GUESSES.amount),
          note: guessColumn(fields, GUESSES.note),
          category: guessColumn(fields, GUESSES.category),
        });
      },
      error: () => setParseError("Could not read that file. Is it a valid CSV?"),
    });
  }

  // Recomputed on every dropdown change — this is what makes the preview live
  const { valid, skipped } = useMemo(() => {
    if (!rawRows.length || !mapping.date || !mapping.amount) {
      return { valid: [], skipped: [] };
    }
    return buildRows({
      rows: rawRows,
      mapping,
      dateFormat,
      categories,
      defaultCategoryId,
    });
  }, [rawRows, mapping, dateFormat, categories, defaultCategoryId]);

  const total = valid.reduce((sum, r) => sum + r.amountPaise, 0);

  async function handleImport() {
    if (importing || valid.length === 0) return;
    setImporting(true);

    const payload = valid.map((r) => ({
      date: r.date,
      amountPaise: r.amountPaise,
      note: r.note,
      categoryId: r.categoryId,
    }));

    const response = await importExpenses(payload);
    setImporting(false);

    if (response.error) {
      setParseError(response.error);
      return;
    }

    setResult(response);
    setHeaders([]);
    setRawRows([]);
    if (fileRef.current) fileRef.current.value = "";
  }

  // ===== after a successful import =====
  if (result) {
    return (
      <div className="card card-padded">
        <div className="empty-state" style={{ padding: "32px 16px" }}>
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-title">
            {result.imported} {result.imported === 1 ? "expense" : "expenses"} imported
          </div>
          <div className="empty-state-desc" style={{ lineHeight: 1.7 }}>
            {result.duplicates > 0 && (
              <>
                {result.duplicates} already existed and{" "}
                {result.duplicates === 1 ? "was" : "were"} skipped.
                <br />
              </>
            )}
            {result.rejected > 0 && (
              <>
                {result.rejected} could not be read and{" "}
                {result.rejected === 1 ? "was" : "were"} left out.
                <br />
              </>
            )}
            {result.duplicates === 0 && result.rejected === 0 && "Everything went in cleanly."}
          </div>
          <div style={{ display: "flex", gap: "10px", marginTop: "18px", flexWrap: "wrap", justifyContent: "center" }}>
            <a href="/dashboard/expenses" className="btn-primary">
              View expenses
            </a>
            <button className="btn-secondary" onClick={reset}>
              Import another file
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ===== nothing loaded yet =====
  if (headers.length === 0) {
    return (
      <div className="card card-padded">
        <div className="empty-state" style={{ padding: "40px 16px" }}>
          <div className="empty-state-icon">📄</div>
          <div className="empty-state-title">Choose a CSV file</div>
          <div className="empty-state-desc" style={{ lineHeight: 1.7 }}>
            Export a statement from your bank or UPI app as CSV.
            <br />
            The first row must be the column headers. Nothing is saved until you
            have seen the preview.
          </div>

          <label className="btn-primary" style={{ marginTop: "18px", cursor: "pointer" }}>
            📂 Pick a file
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              style={{ display: "none" }}
            />
          </label>

          {parseError && (
            <div className="form-error" style={{ marginTop: "16px" }}>
              {parseError}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ===== mapping + preview =====
  return (
    <>
      <div className="card card-padded" style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "18px",
          }}
        >
          <h3 className="panel-title" style={{ marginBottom: 0 }}>
            🔗 Match up the columns
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            {fileName} · {rawRows.length} rows
          </span>
        </div>

        <div className="form-row">
          <label className="form-label" htmlFor="map-date">
            Date column
          </label>
          <select
            id="map-date"
            className="select-field"
            value={mapping.date}
            onChange={(e) => setMapping({ ...mapping, date: e.target.value })}
          >
            <option value="">— choose —</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label className="form-label" htmlFor="map-format">
            Date format
          </label>
          <select
            id="map-format"
            className="select-field"
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
          >
            {DATE_FORMATS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label className="form-label" htmlFor="map-amount">
            Amount column
          </label>
          <select
            id="map-amount"
            className="select-field"
            value={mapping.amount}
            onChange={(e) => setMapping({ ...mapping, amount: e.target.value })}
          >
            <option value="">— choose —</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
          <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "6px" }}>
            Pick the withdrawal or debit column. Credits and the running balance
            are not expenses.
          </div>
        </div>

        <div className="form-row">
          <label className="form-label" htmlFor="map-note">
            Description column
          </label>
          <select
            id="map-note"
            className="select-field"
            value={mapping.note}
            onChange={(e) => setMapping({ ...mapping, note: e.target.value })}
          >
            <option value="">— none —</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row">
          <label className="form-label" htmlFor="map-default-cat">
            Put everything in
          </label>
          <select
            id="map-default-cat"
            className="select-field"
            value={defaultCategoryId}
            onChange={(e) => setDefaultCategoryId(e.target.value)}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.emoji} {c.name}
              </option>
            ))}
          </select>
          <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "6px" }}>
            You can re-categorise individual expenses afterwards.
          </div>
        </div>

        {headers.length > 0 && (
          <div className="form-row">
            <label className="form-label" htmlFor="map-category">
              Category column (optional)
            </label>
            <select
              id="map-category"
              className="select-field"
              value={mapping.category}
              onChange={(e) => setMapping({ ...mapping, category: e.target.value })}
            >
              <option value="">— none —</option>
              {headers.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
            <div style={{ fontSize: "0.76rem", color: "var(--text-muted)", marginTop: "6px" }}>
              If the file names categories, they are matched to yours. Anything
              unrecognised falls back to the choice above.
            </div>
          </div>
        )}
      </div>

      {/* ===== preview ===== */}
      <div className="card card-padded" style={{ marginBottom: "20px" }}>
        <h3 className="panel-title">👀 Preview</h3>

        {!mapping.date || !mapping.amount ? (
          <div className="empty-state" style={{ padding: "24px 16px" }}>
            <div className="empty-state-desc">
              Choose the date and amount columns to see what will be imported.
            </div>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "flex",
                gap: "22px",
                flexWrap: "wrap",
                marginBottom: "18px",
                fontSize: "0.85rem",
              }}
            >
              <span>
                <strong style={{ color: "var(--success)" }}>{valid.length}</strong> ready
              </span>
              <span>
                <strong style={{ color: skipped.length ? "var(--warning)" : "inherit" }}>
                  {skipped.length}
                </strong>{" "}
                skipped
              </span>
              <span>
                total <strong>{formatCurrency(total)}</strong>
              </span>
            </div>

            {valid.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {valid.slice(0, PREVIEW_LIMIT).map((row) => (
                  <div key={row.line} className="recent-row">
                    <div>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600 }}>
                        {row.note || "(no description)"}
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "3px" }}>
                        {formatDate(row.date)}
                      </div>
                    </div>
                    <div className="amount negative" style={{ fontSize: "0.88rem" }}>
                      {formatCurrency(row.amountPaise)}
                    </div>
                  </div>
                ))}
                {valid.length > PREVIEW_LIMIT && (
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", paddingTop: "6px" }}>
                    …and {valid.length - PREVIEW_LIMIT} more
                  </div>
                )}
              </div>
            )}

            {skipped.length > 0 && (
              <details style={{ marginTop: "18px" }}>
                <summary style={{ cursor: "pointer", fontSize: "0.85rem", fontWeight: 600 }}>
                  {skipped.length} rows will be skipped — see why
                </summary>
                <div
                  style={{
                    marginTop: "12px",
                    maxHeight: "220px",
                    overflowY: "auto",
                    fontSize: "0.78rem",
                    color: "var(--text-muted)",
                    lineHeight: 1.8,
                  }}
                >
                  {skipped.map((s, i) => (
                    <div key={`${s.line}-${i}`}>
                      Line {s.line}: {s.reason}
                      {s.raw ? ` — ${s.raw}` : ""}
                    </div>
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </div>

      {parseError && (
        <div className="form-error" style={{ marginBottom: "16px" }}>
          {parseError}
        </div>
      )}

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <button
          className="btn-primary"
          onClick={handleImport}
          disabled={importing || valid.length === 0}
        >
          {importing ? (
            <span className="spinner" style={{ width: "16px", height: "16px" }} />
          ) : (
            `Import ${valid.length} ${valid.length === 1 ? "expense" : "expenses"}`
          )}
        </button>
        <button className="btn-secondary" onClick={reset} disabled={importing}>
          Cancel
        </button>
      </div>

      <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "14px", lineHeight: 1.6 }}>
        Anything already in your expenses is skipped automatically, so
        re-importing an overlapping statement will not create duplicates.
      </p>
    </>
  );
}
