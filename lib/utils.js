// 🛠️ Utility Functions
// Helper functions jo poore app mein use hongi

// 🇮🇳 App ka timezone — "is mahine" ka matlab hamesha IST se decide hoga,
// chahe server Vercel (UTC) pe chal raha ho ya laptop pe.
export const APP_TIMEZONE = "Asia/Kolkata";

/**
 * Paise ko ₹ formatted string mein convert karta hai
 * 15000 paise → "₹150"
 * Indian format: 1,00,000 (lakhs)
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
 * Rupees ko paise mein convert karta hai (store ke liye)
 * 150 → 15000
 */
export function toPaise(rupees) {
  return Math.round(Number(rupees) * 100);
}

/**
 * Paise ko rupees mein convert karta hai (display ke liye)
 * 15000 → 150
 */
export function toRupees(paise) {
  return (Number(paise) || 0) / 100;
}

// =============================================
// 📅 DATE HELPERS
// Rule: expense/budget/goal ki date sirf "calendar din" hai — time nahi.
// Isliye DB mein UTC midnight pe store hoti hai aur display bhi UTC
// mein hota hai. Warna server timezone badalne pe din khisak jaata hai.
// =============================================

/**
 * "2026-08-20" jaisi date string ko UTC midnight Date mein badalta hai.
 * new Date("2026-08-20") bhi UTC midnight deta hai, par "20 Aug 2026"
 * jaise inputs local time le lete hain — isliye ye explicit parser.
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
 * Kisi bhi date ke IST wale calendar parts — { year, month (1-12), day }
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
 * Aaj ki date "YYYY-MM-DD" format mein (IST) — <input type="date"> ke liye
 */
export function todayInputValue() {
  const { year, month, day } = getISTParts();
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * Date object ko "YYYY-MM-DD" mein (UTC) — edit form ke liye
 */
export function toInputValue(date) {
  const d = parseDateOnly(date);
  return d ? d.toISOString().split("T")[0] : "";
}

/**
 * Current month aur year — IST ke hisaab se
 */
export function getCurrentMonthYear() {
  const { month, year } = getISTParts();
  return { month, year };
}

/**
 * Kisi month ka { start, end } range — Prisma query ke liye.
 * Dates UTC midnight pe store hoti hain, isliye range bhi UTC mein.
 */
export function getMonthRange(month, year) {
  return {
    start: new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0)),
    end: new Date(Date.UTC(year, month, 0, 23, 59, 59, 999)),
  };
}

/**
 * Month/year ko +1 ya -1 shift karta hai (year rollover ke saath)
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
 * Date ko readable Indian format mein — "17 Aug 2026"
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
 * Date ko "2 din pehle" type relative format mein
 */
export function formatRelativeDate(date) {
  const then = parseDateOnly(date);
  if (!then) return "";

  const { year, month, day } = getISTParts();
  const today = Date.UTC(year, month - 1, day);
  const diffDays = Math.round((today - then.getTime()) / 86400000);

  if (diffDays < 0) return formatDate(date);
  if (diffDays === 0) return "Aaj";
  if (diffDays === 1) return "Kal";
  if (diffDays < 7) return `${diffDays} din pehle`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} hafta pehle`;
  return formatDate(date);
}

/**
 * Budget percentage ke hisab se status
 */
export function getBudgetStatus(spent, budget) {
  if (!budget || budget <= 0) return { percent: 0, status: "safe", color: "var(--success)" };
  const percent = Math.round((spent / budget) * 100);

  if (percent >= 90) return { percent, status: "danger", color: "var(--danger)" };
  if (percent >= 70) return { percent, status: "warning", color: "var(--warning)" };
  return { percent, status: "safe", color: "var(--success)" };
}

/**
 * Percent → "safe" | "warning" | "danger" (progress bars ke liye)
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
