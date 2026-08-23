"use client";

// Receipt scanner UI.
//
// Three steps: pick an image, let the model read it, then confirm. The
// confirm step is not a formality — the model can misread a total, so the
// expense is only created once the user has looked at the numbers and
// submitted them through the normal addExpense action.

import { useState, useRef, useEffect } from "react";
import { scanReceipt } from "@/lib/actions/receipt";
import { addExpense } from "@/lib/actions/expense";
import { todayInputValue } from "@/lib/utils";

export default function ReceiptScanner({ categories, quota }) {
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);
  const [scanned, setScanned] = useState(null); // { merchant, amount, date, dateWasGuessed }
  const [remaining, setRemaining] = useState(quota?.remaining ?? null);

  const fileInputRef = useRef(null);
  const formRef = useRef(null);

  // Release the preview URL when it is replaced or the component goes away
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  function reset() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setFile(null);
    setScanned(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleFileChange(e) {
    const picked = e.target.files?.[0];
    if (!picked) return;

    if (preview) URL.revokeObjectURL(preview);
    setPreview(URL.createObjectURL(picked));
    setFile(picked);
    setScanned(null);
    setError("");
  }

  async function handleScan() {
    if (!file || scanning) return;

    setScanning(true);
    setError("");

    const fd = new FormData();
    fd.set("image", file);

    const result = await scanReceipt(fd);
    setScanning(false);

    if (result.error) {
      setError(result.error);
    } else {
      setScanned(result.data);
      if (typeof result.remaining === "number") setRemaining(result.remaining);
    }
  }

  async function handleSave(e) {
    e.preventDefault();
    if (saving) return;

    setSaving(true);
    setError("");

    const result = await addExpense(new FormData(formRef.current));
    setSaving(false);

    if (result.error) {
      setError(result.error);
    } else {
      reset();
      setToast("Expense added from receipt! 🎉");
      setTimeout(() => setToast(null), 3000);
    }
  }

  return (
    <>
      <div className="dashboard-grid-2">
        {/* Left: pick and scan */}
        <div className="card card-padded">
          <h3 className="panel-title">📸 Receipt Photo</h3>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            style={{ display: "none" }}
            id="receipt-file-input"
          />

          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              style={{
                border: "2px dashed var(--border-default)",
                borderRadius: "var(--radius-md)",
                padding: "48px 24px",
                textAlign: "center",
                cursor: "pointer",
                background: "var(--bg-light)",
              }}
            >
              <div style={{ fontSize: "2.5rem", marginBottom: "12px" }}>🧾</div>
              <div style={{ fontWeight: 600, marginBottom: "6px" }}>
                Tap to pick a receipt photo
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                JPG, PNG or WebP · up to 5 MB
              </div>
            </div>
          ) : (
            <>
              <img
                src={preview}
                alt="Receipt preview"
                style={{
                  width: "100%",
                  maxHeight: "320px",
                  objectFit: "contain",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-light)",
                  background: "var(--bg-light)",
                }}
              />
              <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleScan}
                  disabled={scanning || !!scanned}
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  {scanning ? (
                    <>
                      <span className="spinner" style={{ width: "16px", height: "16px" }} />
                      Reading...
                    </>
                  ) : scanned ? (
                    "Scanned ✓"
                  ) : (
                    "Scan Receipt"
                  )}
                </button>
                <button type="button" className="btn-secondary" onClick={reset} disabled={scanning}>
                  Clear
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="form-error" style={{ marginTop: "16px" }}>
              ❌ {error}
            </div>
          )}

          {typeof remaining === "number" && (
            <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "14px" }}>
              {remaining} of {quota.limit} AI requests left today
            </div>
          )}
        </div>

        {/* Right: confirm and save */}
        <div className="card card-padded">
          <h3 className="panel-title">✏️ Check &amp; Save</h3>

          {!scanned ? (
            <div className="empty-state" style={{ padding: "40px 16px" }}>
              <div className="empty-state-icon">📝</div>
              <div className="empty-state-title">Nothing scanned yet</div>
              <div className="empty-state-desc">
                Pick a receipt and scan it — the fields will be filled in here for you to check.
              </div>
            </div>
          ) : (
            <form ref={formRef} onSubmit={handleSave}>
              <div
                style={{
                  background: "var(--accent-bg)",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-md)",
                  padding: "12px 14px",
                  marginBottom: "20px",
                  fontSize: "0.8rem",
                  lineHeight: 1.6,
                }}
              >
                Read from the receipt
                {scanned.merchant ? (
                  <>
                    {" "}at <strong>{scanned.merchant}</strong>
                  </>
                ) : null}
                . Check the amount before saving — scans are not always perfect.
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="scan-amount">💰 Amount (₹)</label>
                <input
                  id="scan-amount"
                  type="number"
                  name="amount"
                  className="input-field"
                  defaultValue={scanned.amount}
                  step="0.01"
                  min="0"
                  required
                  inputMode="decimal"
                />
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="scan-category">🏷️ Category</label>
                <select
                  id="scan-category"
                  name="categoryId"
                  className="select-field"
                  defaultValue=""
                  required
                >
                  <option value="">-- Choose a category --</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.emoji} {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="scan-date">📅 Date</label>
                <input
                  id="scan-date"
                  type="date"
                  name="date"
                  className="input-field"
                  defaultValue={scanned.date}
                  max={todayInputValue()}
                  required
                />
                {scanned.dateWasGuessed && (
                  <div style={{ fontSize: "0.72rem", color: "var(--warning)", marginTop: "6px" }}>
                    The date was not readable on the receipt, so today's date is filled in.
                  </div>
                )}
              </div>

              <div className="form-row">
                <label className="form-label" htmlFor="scan-note">📝 Note</label>
                <input
                  id="scan-note"
                  type="text"
                  name="note"
                  className="input-field"
                  defaultValue={scanned.merchant}
                  maxLength={200}
                  placeholder="e.g. shop name"
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={reset} disabled={saving}>
                  Discard
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? (
                    <>
                      <span className="spinner" style={{ width: "16px", height: "16px" }} />
                      Saving...
                    </>
                  ) : (
                    "Add Expense 🚀"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {toast && (
        <div className="toast success" role="status">
          ✅ {toast}
        </div>
      )}
    </>
  );
}
