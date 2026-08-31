// Subscription detection.
//
// Finds expenses that look like something renewing on a schedule — Netflix,
// the gym, a phone plan — so the user can be asked "is this a subscription?"
// instead of typing them all in by hand.
//
// A note on what this can and cannot see: Expense has no merchant column. The
// only human-written identifier is `note`, so that is what groups a series
// together. Expenses with no note are ignored — a bare "Food & Dining" row
// carries nothing to match on, and guessing from the category alone would flag
// every month's groceries as a subscription.
//
// Nothing here touches the database, which keeps the rules easy to reason
// about and easy to test with a made-up list of expenses.

const DAY = 86400000;

// Cadences we recognise, with the tolerance real billing actually shows.
// Monthly billing lands anywhere from 28 to 31 days apart depending on the
// month, and card processors add a day either side, hence 25-36.
const CADENCES = [
  { frequency: "monthly", minDays: 25, maxDays: 36, typicalDays: 30 },
  { frequency: "yearly", minDays: 350, maxDays: 380, typicalDays: 365 },
];

// Two charges is enough to suggest a pattern, but only just — the confidence
// score below leans hard on having a third.
const MIN_OCCURRENCES = 2;

// A subscription's price can drift (a plan change, a tax revision) without
// stopping being the same subscription. Beyond this the series is not one
// thing any more.
const MAX_AMOUNT_SPREAD = 1.2;

/**
 * Collapses a note into a grouping key: "Netflix", "netflix " and
 * "NETFLIX!" all become "netflix".
 *
 * Deliberately conservative. "Netflix" and "Netflix Premium" stay separate,
 * because merging them would silently average two different prices together.
 */
export function normalizeNote(note) {
  return String(note || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function median(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round((sorted[mid - 1] + sorted[mid]) / 2)
    : sorted[mid];
}

function daysBetween(a, b) {
  return Math.round((b.getTime() - a.getTime()) / DAY);
}

/**
 * Scores how subscription-like a series is, 0-100.
 *
 * Three things matter, in this order:
 *   - how many times it has repeated (two is a coincidence, four is a habit)
 *   - how regular the gaps are (a real subscription lands on the same date)
 *   - how steady the amount is
 */
function scoreSeries({ occurrences, gaps, amounts, cadence }) {
  // 2 charges -> 40, 3 -> 55, 4 -> 70, 5+ -> 80
  const countScore = Math.min(80, 25 + occurrences * 15 - 10);

  // How far the gaps stray from the cadence's typical length
  const gapDrift =
    gaps.reduce((sum, g) => sum + Math.abs(g - cadence.typicalDays), 0) / gaps.length;
  const gapScore = Math.max(0, 10 - gapDrift); // 0-10

  const spread = Math.max(...amounts) / Math.min(...amounts);
  const amountScore = spread === 1 ? 10 : Math.max(0, 10 - (spread - 1) * 50); // 0-10

  return Math.round(Math.min(100, countScore + gapScore + amountScore));
}

/**
 * Looks through a user's expenses and returns the series that look recurring.
 *
 * `expenses` is [{ id, amount, note, date, categoryName, categoryEmoji }]
 * with amount in paise and date a Date. Returns candidates sorted strongest
 * first — nothing is created, this only proposes.
 */
export function detectSubscriptions(expenses = []) {
  const groups = new Map();

  for (const expense of expenses) {
    const key = normalizeNote(expense.note);
    if (!key) continue; // no note, nothing to identify it by

    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(expense);
  }

  const candidates = [];

  for (const [key, group] of groups) {
    if (group.length < MIN_OCCURRENCES) continue;

    const series = [...group].sort((a, b) => a.date - b.date);

    // Two charges on the same day are a double-entry, not a cadence
    const gaps = [];
    for (let i = 1; i < series.length; i++) {
      gaps.push(daysBetween(series[i - 1].date, series[i].date));
    }
    if (gaps.some((g) => g <= 0)) continue;

    // Every gap has to fit the same cadence. A series that is monthly twice
    // and then jumps a year is two different things stuck together.
    const cadence = CADENCES.find((c) =>
      gaps.every((g) => g >= c.minDays && g <= c.maxDays)
    );
    if (!cadence) continue;

    const amounts = series.map((e) => e.amount);
    if (Math.max(...amounts) / Math.min(...amounts) > MAX_AMOUNT_SPREAD) continue;

    const last = series[series.length - 1];
    const typicalGap = median(gaps);

    candidates.push({
      key,
      // The note as the user last wrote it, not the flattened key
      name: last.note.trim(),
      categoryName: last.categoryName,
      categoryEmoji: last.categoryEmoji,
      frequency: cadence.frequency,
      // The most recent price is the one to carry forward, not the average
      amount: last.amount,
      occurrences: series.length,
      firstSeen: series[0].date,
      lastSeen: last.date,
      averageGapDays: typicalGap,
      nextDueDate: new Date(last.date.getTime() + typicalGap * DAY),
      confidence: scoreSeries({
        occurrences: series.length,
        gaps,
        amounts,
        cadence,
      }),
    });
  }

  return candidates.sort((a, b) => b.confidence - a.confidence);
}

/**
 * Drops candidates the user has already saved or already dismissed.
 * Matching is done on the normalized name so "Netflix" saved once does not
 * come back as "netflix ".
 */
export function excludeKnown(candidates, existingNames = []) {
  const known = new Set(existingNames.map(normalizeNote).filter(Boolean));
  return candidates.filter((c) => !known.has(c.key));
}
