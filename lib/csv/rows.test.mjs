// Tests for CSV row parsing.
//
// Run with `npm test`. The cases here come from what bank and UPI exports
// actually look like: Indian digit grouping, day-first dates, Dr/Cr suffixes,
// blank footer lines, and the same statement being imported twice.

import test from "node:test";
import assert from "node:assert/strict";
import { parseAmount, parseDate, rowKey, buildRows } from "./rows.js";

// ===== amounts =====

test("parseAmount reads plain numbers", () => {
  assert.equal(parseAmount("150"), 150);
  assert.equal(parseAmount("150.75"), 150.75);
});

test("parseAmount strips currency symbols and Indian digit grouping", () => {
  assert.equal(parseAmount("₹1,234.50"), 1234.5);
  assert.equal(parseAmount("1,23,456"), 123456);
  assert.equal(parseAmount("  ₹ 99 "), 99);
});

test("parseAmount ignores Dr/Cr markers banks append", () => {
  assert.equal(parseAmount("500.00 Dr"), 500);
  assert.equal(parseAmount("INR 250"), 250);
});

test("parseAmount treats debits as positive however they are marked", () => {
  assert.equal(parseAmount("-500"), 500);
  assert.equal(parseAmount("(500)"), 500);
});

test("parseAmount rejects what is not an amount", () => {
  assert.equal(parseAmount(""), null);
  assert.equal(parseAmount("   "), null);
  assert.equal(parseAmount("N/A"), null);
  assert.equal(parseAmount("0"), null); // a zero-rupee expense is not one
  assert.equal(parseAmount(null), null);
});

test("parseAmount rejects figures too large to be one expense", () => {
  // Guards against a running-balance column being mapped by mistake
  assert.equal(parseAmount("50,00,000"), null);
});

// ===== dates =====

test("parseDate reads ISO dates", () => {
  assert.equal(parseDate("2026-08-05"), "2026-08-05");
  assert.equal(parseDate("2026/08/05"), "2026-08-05");
});

test("parseDate defaults to day-first, as Indian statements are", () => {
  assert.equal(parseDate("05/08/2026"), "2026-08-05");
  assert.equal(parseDate("05-08-2026"), "2026-08-05");
  assert.equal(parseDate("5.8.2026"), "2026-08-05");
});

test("parseDate expands two-digit years", () => {
  assert.equal(parseDate("05/08/26"), "2026-08-05");
});

test("parseDate honours an explicit month-first choice", () => {
  assert.equal(parseDate("05/08/2026", "MDY"), "2026-05-08");
  assert.equal(parseDate("05/08/2026", "DMY"), "2026-08-05");
});

test("auto-detect falls back to month-first when day-first is impossible", () => {
  // 12/25 cannot be a 25th month, so this can only be December 25th
  assert.equal(parseDate("12/25/2026"), "2026-12-25");
});

test("parseDate reads textual dates", () => {
  assert.equal(parseDate("05 Aug 2026"), "2026-08-05");
});

test("parseDate rejects impossible and unreadable dates", () => {
  assert.equal(parseDate("31/02/2026"), null); // no 31st of February
  assert.equal(parseDate("not a date"), null);
  assert.equal(parseDate(""), null);
  assert.equal(parseDate("05/08/1823"), null); // outside 2000-2100
});

// ===== dedup key =====

test("rowKey ignores note case and spacing", () => {
  const a = rowKey({ date: "2026-08-05", amountPaise: 15000, note: "Chai" });
  const b = rowKey({ date: "2026-08-05", amountPaise: 15000, note: "  chai  " });
  assert.equal(a, b);
});

test("rowKey separates different dates, amounts and notes", () => {
  const base = { date: "2026-08-05", amountPaise: 15000, note: "Chai" };
  assert.notEqual(rowKey(base), rowKey({ ...base, date: "2026-08-06" }));
  assert.notEqual(rowKey(base), rowKey({ ...base, amountPaise: 15001 }));
  assert.notEqual(rowKey(base), rowKey({ ...base, note: "Coffee" }));
});

// ===== buildRows =====

const categories = [
  { id: "cat-food", name: "Food & Dining" },
  { id: "cat-tea", name: "Tea & Snacks" },
];
const mapping = { date: "Date", amount: "Withdrawal", note: "Narration" };

test("buildRows converts a normal statement", () => {
  const { valid, skipped } = buildRows({
    rows: [
      { Date: "05/08/2026", Withdrawal: "₹1,234.50", Narration: "Swiggy" },
      { Date: "06/08/2026", Withdrawal: "150", Narration: "Chai" },
    ],
    mapping,
    categories,
    defaultCategoryId: "cat-food",
  });

  assert.equal(skipped.length, 0);
  assert.equal(valid.length, 2);
  assert.equal(valid[0].date, "2026-08-05");
  assert.equal(valid[0].amountPaise, 123450);
  assert.equal(valid[0].note, "Swiggy");
  assert.equal(valid[0].categoryId, "cat-food");
});

test("buildRows reports the line number of anything it skips", () => {
  const { valid, skipped } = buildRows({
    rows: [
      { Date: "05/08/2026", Withdrawal: "100", Narration: "Good row" },
      { Date: "rubbish", Withdrawal: "200", Narration: "Bad date" },
      { Date: "07/08/2026", Withdrawal: "abc", Narration: "Bad amount" },
    ],
    mapping,
    categories,
    defaultCategoryId: "cat-food",
  });

  assert.equal(valid.length, 1);
  assert.equal(skipped.length, 2);
  // Line 2 is the first data row, since line 1 is the header
  assert.equal(skipped[0].line, 3);
  assert.match(skipped[0].reason, /date/i);
  assert.equal(skipped[1].line, 4);
  assert.match(skipped[1].reason, /amount/i);
});

test("buildRows skips the blank lines statements end with", () => {
  const { valid, skipped } = buildRows({
    rows: [
      { Date: "05/08/2026", Withdrawal: "100", Narration: "Real" },
      { Date: "", Withdrawal: "", Narration: "" },
    ],
    mapping,
    categories,
    defaultCategoryId: "cat-food",
  });

  assert.equal(valid.length, 1);
  assert.equal(skipped.length, 1);
  assert.equal(skipped[0].reason, "Empty row");
});

test("buildRows drops duplicates within the same file", () => {
  const { valid, skipped } = buildRows({
    rows: [
      { Date: "05/08/2026", Withdrawal: "100", Narration: "Chai" },
      { Date: "05/08/2026", Withdrawal: "100", Narration: "Chai" },
    ],
    mapping,
    categories,
    defaultCategoryId: "cat-food",
  });

  assert.equal(valid.length, 1);
  assert.equal(skipped.length, 1);
  assert.match(skipped[0].reason, /duplicate/i);
});

test("buildRows matches a category column by name, falling back to the default", () => {
  const { valid } = buildRows({
    rows: [
      { Date: "05/08/2026", Withdrawal: "100", Narration: "A", Type: "tea & snacks" },
      { Date: "06/08/2026", Withdrawal: "100", Narration: "B", Type: "Nonsense" },
    ],
    mapping: { ...mapping, category: "Type" },
    categories,
    defaultCategoryId: "cat-food",
  });

  assert.equal(valid[0].categoryId, "cat-tea"); // matched, case-insensitively
  assert.equal(valid[1].categoryId, "cat-food"); // unmatched, fell back
});

test("buildRows refuses rows with no category at all", () => {
  const { valid, skipped } = buildRows({
    rows: [{ Date: "05/08/2026", Withdrawal: "100", Narration: "A" }],
    mapping,
    categories,
    defaultCategoryId: null,
  });

  assert.equal(valid.length, 0);
  assert.match(skipped[0].reason, /category/i);
});

test("buildRows truncates an over-long note rather than failing the row", () => {
  const { valid } = buildRows({
    rows: [{ Date: "05/08/2026", Withdrawal: "100", Narration: "x".repeat(500) }],
    mapping,
    categories,
    defaultCategoryId: "cat-food",
  });

  assert.equal(valid.length, 1);
  assert.equal(valid[0].note.length, 200);
});
