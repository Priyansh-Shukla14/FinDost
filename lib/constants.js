// App-wide constants, kept in one place so magic numbers
// don't get scattered through the codebase.

// How many expenses to show on a single page
export const EXPENSES_PER_PAGE = 25;

// Palette used when creating a custom category
export const CATEGORY_COLORS = [
  "#10b981", "#0ea5e9", "#8b5cf6", "#f59e0b",
  "#ef4444", "#ec4899", "#14b8a6", "#f97316",
  "#6366f1", "#84cc16",
];

// Percentage of a monthly budget that triggers the alert email.
// Overridable with BUDGET_ALERT_THRESHOLD so it can be dropped to a low number
// while testing without editing code.
export const BUDGET_ALERT_THRESHOLD = (() => {
  const parsed = parseInt(process.env.BUDGET_ALERT_THRESHOLD, 10);
  return Number.isFinite(parsed) && parsed > 0 && parsed <= 500 ? parsed : 80;
})();
