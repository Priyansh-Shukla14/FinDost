// Tests for the subscription detector.
//
// Run with `npm test`. Uses Node's built-in test runner, so there is no test
// framework to install — detect.js is a pure function, which is most of the
// reason it was written as one.
//
// The interesting cases are the negative ones. A detector that finds every
// real subscription is easy; one that does not also flag the weekly grocery
// run is the hard part, and that is what most of these assert.

import test from "node:test";
import assert from "node:assert/strict";
import { detectSubscriptions, excludeKnown, normalizeNote } from "./detect.js";

const d = (iso) => new Date(`${iso}T00:00:00Z`);
const expense = (note, amount, date, categoryName = "Entertainment", categoryEmoji = "🎬") => ({
  id: `${note}-${date}`,
  note,
  amount,
  date: d(date),
  categoryName,
  categoryEmoji,
});

test("normalizeNote collapses case, spacing and punctuation", () => {
  assert.equal(normalizeNote("  NETFLIX  "), "netflix");
  assert.equal(normalizeNote("Netflix!"), "netflix");
  assert.equal(normalizeNote(""), "");
  assert.equal(normalizeNote(null), "");
});

test("normalizeNote keeps genuinely different plans apart", () => {
  // Merging these would silently average two different prices together
  assert.notEqual(normalizeNote("Netflix Premium"), normalizeNote("Netflix"));
});

test("a monthly charge repeating four times is detected", () => {
  const found = detectSubscriptions([
    expense("Netflix", 64900, "2026-05-05"),
    expense("Netflix", 64900, "2026-06-04"),
    expense("Netflix", 64900, "2026-07-05"),
    expense("Netflix", 64900, "2026-08-05"),
  ]);

  assert.equal(found.length, 1);
  assert.equal(found[0].name, "Netflix");
  assert.equal(found[0].frequency, "monthly");
  assert.equal(found[0].occurrences, 4);
  assert.ok(found[0].confidence >= 85, `confidence was ${found[0].confidence}`);
});

test("the latest price is carried forward, not the average", () => {
  const found = detectSubscriptions([
    expense("Spotify", 11900, "2026-06-01"),
    expense("Spotify", 11900, "2026-07-01"),
    expense("Spotify", 12900, "2026-08-01"), // price went up
  ]);

  assert.equal(found[0].amount, 12900);
});

test("next due date lands about one cycle after the last charge", () => {
  const found = detectSubscriptions([
    expense("Netflix", 64900, "2026-06-05"),
    expense("Netflix", 64900, "2026-07-05"),
    expense("Netflix", 64900, "2026-08-05"),
  ]);

  assert.ok(
    found[0].nextDueDate.toISOString().startsWith("2026-09-0"),
    `next due was ${found[0].nextDueDate.toISOString()}`
  );
});

test("expenses with no note are ignored", () => {
  // Monthly groceries look exactly like a subscription apart from the note
  const found = detectSubscriptions([
    expense("", 20000, "2026-06-01", "Food & Dining", "🍔"),
    expense("", 20000, "2026-07-01", "Food & Dining", "🍔"),
    expense("", 20000, "2026-08-01", "Food & Dining", "🍔"),
  ]);

  assert.equal(found.length, 0);
});

test("one charge on its own is not a series", () => {
  assert.equal(detectSubscriptions([expense("Haircut", 30000, "2026-08-01")]).length, 0);
});

test("charges a few days apart are not a monthly cadence", () => {
  const found = detectSubscriptions([
    expense("Auto", 5000, "2026-08-01"),
    expense("Auto", 5000, "2026-08-04"),
    expense("Auto", 5000, "2026-08-09"),
  ]);

  assert.equal(found.length, 0);
});

test("one irregular gap breaks the series", () => {
  const found = detectSubscriptions([
    expense("Swiggy", 30000, "2026-06-01"),
    expense("Swiggy", 30000, "2026-07-01"),
    expense("Swiggy", 30000, "2026-11-15"),
  ]);

  assert.equal(found.length, 0);
});

test("a large price swing is not one subscription", () => {
  const found = detectSubscriptions([
    expense("Shopping", 10000, "2026-06-01"),
    expense("Shopping", 90000, "2026-07-01"),
    expense("Shopping", 10000, "2026-08-01"),
  ]);

  assert.equal(found.length, 0);
});

test("two charges on the same day are a double entry, not a cadence", () => {
  const found = detectSubscriptions([
    expense("Rent", 800000, "2026-08-01"),
    expense("Rent", 800000, "2026-08-01"),
  ]);

  assert.equal(found.length, 0);
});

test("yearly renewals are recognised, including a modest price rise", () => {
  const found = detectSubscriptions([
    expense("Domain renewal", 89900, "2024-09-10"),
    expense("Domain renewal", 94900, "2025-09-12"),
    expense("Domain renewal", 99900, "2026-09-11"),
  ]);

  assert.equal(found.length, 1);
  assert.equal(found[0].frequency, "yearly");
});

test("the stronger series is ranked first", () => {
  const found = detectSubscriptions([
    expense("Netflix", 64900, "2026-05-05"),
    expense("Netflix", 64900, "2026-06-04"),
    expense("Netflix", 64900, "2026-07-05"),
    expense("Netflix", 64900, "2026-08-05"),
    expense("Gym", 150000, "2026-07-02"),
    expense("Gym", 150000, "2026-08-02"),
  ]);

  assert.equal(found.length, 2);
  assert.equal(found[0].name, "Netflix");
});

test("an already-saved subscription is not suggested again", () => {
  const found = detectSubscriptions([
    expense("Netflix", 64900, "2026-06-05"),
    expense("Netflix", 64900, "2026-07-05"),
    expense("Netflix", 64900, "2026-08-05"),
    expense("Gym", 150000, "2026-07-02"),
    expense("Gym", 150000, "2026-08-02"),
  ]);

  // Saved with different spacing and case on purpose
  const remaining = excludeKnown(found, ["  netflix "]);

  assert.equal(remaining.length, 1);
  assert.equal(remaining[0].name, "Gym");
});
