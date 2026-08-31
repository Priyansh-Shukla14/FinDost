// Turning raw CSV cells into expense rows.
//
// Kept free of React and Prisma so the fiddly parts — Indian date order and
// the many ways a bank writes an amount — can be tested directly.
//
// Everything here is defensive by default. A statement export is not a form:
// it has header rows, blank lines, footers, running balances and credits mixed
// in with debits. Anything that cannot be read confidently is reported as a
// skipped row with a reason rather than guessed at, because a wrong amount
// silently imported is far worse than a row the user has to fix by hand.

// Matches lib/validations.js so the preview rejects what the server would
const MAX_RUPEES = 1000000;

export const DATE_FORMATS = [
  { value: "auto", label: "Detect automatically" },
  { value: "DMY", label: "DD/MM/YYYY  (most Indian banks)" },
  { value: "MDY", label: "MM/DD/YYYY  (US style)" },
  { value: "YMD", label: "YYYY-MM-DD  (ISO)" },
];

/**
 * Reads an amount out of whatever the bank wrote.
 *
 * Handles "₹1,234.50", "1234.50 Dr", "(500)" for negatives, and stray spaces.
 * Returns rupees as a positive number, or null when there is no usable figure.
 *
 * The sign is dropped on purpose. Statements mark debits in different ways —
 * a minus, a Dr suffix, brackets, or simply a separate withdrawal column — and
 * the user picks which column to import. Second-guessing that here would flip
 * amounts on some banks and not others.
 */
export function parseAmount(raw) {
  if (raw === null || raw === undefined) return null;

  let text = String(raw).trim();
  if (!text) return null;

  // Strip currency symbols, letters (Dr/Cr/INR) and spaces, keep digits,
  // separators and the sign characters we care about
  text = text.replace(/[₹$£€]/g, "").replace(/[A-Za-z]/g, "").trim();

  const isBracketed = /^\(.*\)$/.test(text);
  text = text.replace(/[()]/g, "");

  // Indian grouping ("1,23,456.78") and plain grouping both just lose commas
  text = text.replace(/,/g, "").replace(/\s/g, "");
  if (!text || text === "-" || text === "+") return null;

  const value = Number(text);
  if (!Number.isFinite(value)) return null;

  const amount = Math.abs(value);
  if (amount <= 0) return null;

  // Guard against a running-balance column being mapped by mistake
  if (amount > MAX_RUPEES) return null;

  void isBracketed; // sign is intentionally ignored, see the note above
  return Math.round(amount * 100) / 100;
}

function isValidYMD(year, month, day) {
  if (year < 2000 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  // Reject 31 February and friends
  const probe = new Date(Date.UTC(year, month - 1, day));
  return probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
}

function toISO(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Reads a date and returns "YYYY-MM-DD", or null.
 *
 * `format` is one of DATE_FORMATS. "auto" prefers ISO, then falls back to
 * day-first, which is what Indian bank exports overwhelmingly use. Where a
 * date is genuinely ambiguous (03/04/2026) auto picks day-first and the
 * preview shows the result, so a wrong guess is visible before importing.
 */
export function parseDate(raw, format = "auto") {
  if (!raw) return null;
  const text = String(raw).trim();
  if (!text) return null;

  // ISO first — unambiguous wherever it appears
  const iso = /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(text);
  if (iso && (format === "auto" || format === "YMD")) {
    const [, y, m, d] = iso.map(Number);
    return isValidYMD(y, m, d) ? toISO(y, m, d) : null;
  }

  const parts = /^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})/.exec(text);
  if (parts) {
    let [, a, b, year] = parts.map(Number);
    if (year < 100) year += 2000; // "26" -> 2026

    const dayFirst = format === "MDY" ? { day: b, month: a } : { day: a, month: b };
    if (isValidYMD(year, dayFirst.month, dayFirst.day)) {
      return toISO(year, dayFirst.month, dayFirst.day);
    }

    // Auto-detect: if day-first did not validate, the file is probably
    // month-first (e.g. 12/25/2026)
    if (format === "auto" && isValidYMD(year, dayFirst.day, dayFirst.month)) {
      return toISO(year, dayFirst.day, dayFirst.month);
    }
    return null;
  }

  // Textual dates like "05 Aug 2026".
  //
  // Date.parse reads a string with no timezone as LOCAL midnight, so the
  // local getters are the ones that give back the date that was written.
  // Reading it with getUTC* instead shifts the day backwards anywhere east
  // of UTC — in IST it turned "05 Aug" into 04 Aug, which a test caught.
  const parsed = Date.parse(text);
  if (!Number.isNaN(parsed)) {
    const dt = new Date(parsed);
    const y = dt.getFullYear();
    if (y >= 2000 && y <= 2100) {
      return toISO(y, dt.getMonth() + 1, dt.getDate());
    }
  }

  return null;
}

/**
 * The key used to spot the same expense twice.
 *
 * Date, amount and note together — the three things a statement gives us.
 * Two genuinely separate ₹50 chai on the same day with the same note would
 * collide, which is the deliberate trade: re-importing an overlapping
 * statement is common, buying the same thing twice with an identical note is
 * not, and a duplicate is only skipped, never deleted.
 */
export function rowKey({ date, amountPaise, note }) {
  const cleanNote = String(note || "").trim().toLowerCase().replace(/\s+/g, " ");
  return `${date}|${amountPaise}|${cleanNote}`;
}

/**
 * Turns PapaParse output into rows ready for import.
 *
 * `rows` are objects keyed by CSV header. `mapping` says which header holds
 * the date, the amount, the note and (optionally) a category name.
 *
 * Returns { valid, skipped } where every skipped row carries the line number
 * and a reason, so the UI can show exactly what will not be imported.
 */
export function buildRows({
  rows = [],
  mapping = {},
  dateFormat = "auto",
  categories = [],
  defaultCategoryId = null,
}) {
  const byName = new Map(
    categories.map((c) => [c.name.trim().toLowerCase(), c.id])
  );

  const valid = [];
  const skipped = [];
  const seen = new Set();

  rows.forEach((row, index) => {
    // +2: one for the header line, one because humans count from 1
    const line = index + 2;

    const rawDate = mapping.date ? row[mapping.date] : "";
    const rawAmount = mapping.amount ? row[mapping.amount] : "";
    const rawNote = mapping.note ? row[mapping.note] : "";

    // Blank lines and footers are normal in bank exports, not errors worth
    // shouting about — but they are still reported
    const isEmpty = !String(rawDate ?? "").trim() && !String(rawAmount ?? "").trim();
    if (isEmpty) {
      skipped.push({ line, reason: "Empty row", raw: "" });
      return;
    }

    const date = parseDate(rawDate, dateFormat);
    if (!date) {
      skipped.push({ line, reason: `Could not read the date "${rawDate ?? ""}"`, raw: String(rawNote || "") });
      return;
    }

    const amount = parseAmount(rawAmount);
    if (amount === null) {
      skipped.push({ line, reason: `Could not read the amount "${rawAmount ?? ""}"`, raw: String(rawNote || "") });
      return;
    }

    const note = String(rawNote || "").trim().slice(0, 200);

    // A category column is matched by name; anything unrecognised falls back
    // to the category chosen for the whole import
    let categoryId = defaultCategoryId;
    if (mapping.category && row[mapping.category]) {
      const matched = byName.get(String(row[mapping.category]).trim().toLowerCase());
      if (matched) categoryId = matched;
    }

    if (!categoryId) {
      skipped.push({ line, reason: "No category chosen for this row", raw: note });
      return;
    }

    const amountPaise = Math.round(amount * 100);
    const key = rowKey({ date, amountPaise, note });

    // Duplicates inside the file itself
    if (seen.has(key)) {
      skipped.push({ line, reason: "Duplicate of an earlier row in this file", raw: note });
      return;
    }
    seen.add(key);

    valid.push({ line, date, amount, amountPaise, note, categoryId, key });
  });

  return { valid, skipped };
}
