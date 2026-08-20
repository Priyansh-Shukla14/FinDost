// Utility functions used across the app

// The app's timezone — "this month" is always decided in IST, whether the
// server runs on Vercel (UTC) or on a laptop.
export const APP_TIMEZONE = "Asia/Kolkata";

/**
 * Converts paise into a formatted rupee string.
 * 15000 paise → "₹150"
 * Indian grouping: 1,00,000 (lakhs)
 */
export function formatCurrency(paise) {
  const rupees = (Number(paise) || 0) / 100;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(rupees);
}

/**
 * Converts rupees into paise (for storage)
 * 150 → 15000
 */
export function toPaise(rupees) {
  return Math.round(Number(rupees) * 100);
}

/**
 * Converts paise into rupees (for display)
 * 15000 → 150
 */
export function toRupees(paise) {
  return (Number(paise) || 0) / 100;
}

// =============================================
// DATE HELPERS
// Rule: an expense/budget/goal date is a calendar day, not a moment in time.
// So it is stored at UTC midnight and displayed in UTC too. Otherwise the
// day shifts whenever the server timezone changes.
// =============================================

/**
 * Turns a date string like "2026-08-20" into a UTC-midnight Date.
 * new Date("2026-08-20") also gives UTC midnight, but inputs like
 * "20 Aug 2026" are parsed as local time — hence this explicit parser.
 */
export function parseDateOnly(value) {
  if (value instanceof Date) {
    return new Date(Date.UTC(value.getUTCFullYear(), value.getUTCMonth(), value.getUTCDate()));
  }
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(value));
  if (match) {
    return new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
  }
  const parsed = new Date(value);
  if (isNaN(parsed)) return null;
  return new Date(Date.UTC(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
}

/**
 * The IST calendar parts of any date — { year, month (1-12), day }
 */
export function getISTParts(date = new Date()) {
  const [year, month, day] = new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
    .format(date)
    .split("-")
    .map(Number);

  return { year, month, day };
}

/**
 * Today's date as "YYYY-MM-DD" (IST) — for <input type="date">
 */
export function todayInputValue() {
  const { year, month, day } = getISTParts();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * A Date object as "YYYY-MM-DD" (UTC) — for the edit form
 */
export function toInputValue(date) {
  const d = parseDateOnly(date);
  return d ? d.toISOString().split("T")[0] : "";
}

/**
 * The current month and year, according to IST
 */
export function getCurrentMonthYear() {
  const { month, year } = getISTParts();
  return { month, year };
}

/**
 * The { start, end } range of a month — for Prisma queries.
 * Dates are stored at UTC midnight, so the range is built in UTC too.
 */
export function getMonthRange(month, year) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
  };
}

/**
 * Shifts a month/year by +1 or -1, handling the year rollover
 */
export function shiftMonth(month, year, direction) {
  let newMonth = month + direction;
  let newYear = year;
  if (newMonth < 1) {
    newMonth = 12;
    newYear -= 1;
  } else if (newMonth > 12) {
    newMonth = 1;
    newYear += 1;
  }
  return { month: newMonth, year: newYear };
}

/**
 * A date in readable Indian format — "17 Aug 2026"
 */
export function formatDate(date) {
  const d = parseDateOnly(date);
  if (!d) return "";
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/**
 * A date in relative form — "2 days ago"
 */
export function formatRelativeDate(date) {
  const then = parseDateOnly(date);
  if (!then) return "";

  const { year, month, day } = getISTParts();
  const today = Date.UTC(year, month - 1, day);
  const diffDays = Math.round((today - then.getTime()) / 86400000);

  if (diffDays < 0) return formatDate(date);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`;
  }
  return formatDate(date);
}

/**
 * Budget status derived from the percentage spent
 */
export function getBudgetStatus(spent, budget) {
  if (!budget || budget <= 0) return { percent: 0, status: "safe", color: "var(--success)" };
  const percent = Math.round((spent / budget) * 100);

  if (percent >= 90) return { percent, status: "danger", color: "var(--danger)" };
  if (percent >= 70) return { percent, status: "warning", color: "var(--warning)" };
  return { percent, status: "safe", color: "var(--success)" };
}

/**
 * Percent → "safe" | "warning" | "danger" (used by progress bars)
 */
export function statusFromPercent(percent) {
  if (percent >= 90) return "danger";
  if (percent >= 70) return "warning";
  return "safe";
}

/**
 * Month number to name
 */
export function getMonthName(month) {
  const months = [
    "", "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  return months[month] || "";
}

/**
 * Short month name — "Jan", "Feb"...
 */
export function getShortMonthName(month) {
  return getMonthName(month).slice(0, 3);
}
