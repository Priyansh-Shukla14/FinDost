// 🛠️ Utility Functions
// Helper functions jo poore app mein use hongi

/**
 * Paise ko ₹ formatted string mein convert karta hai
 * 15000 paise → "₹150.00"
 * Indian format: 1,00,000 (lakhs)
 */
export function formatCurrency(paise) {
  const rupees = paise / 100;
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
  return Math.round(rupees * 100);
}

/**
 * Paise ko rupees mein convert karta hai (display ke liye)
 * 15000 → 150
 */
export function toRupees(paise) {
  return paise / 100;
}

/**
 * Date ko readable Indian format mein
 * "17 Aug 2026"
 */
export function formatDate(date) {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Date ko "2 din pehle" type relative format mein
 */
export function formatRelativeDate(date) {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

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
  if (budget === 0) return { percent: 0, status: "safe", color: "var(--success)" };
  const percent = Math.round((spent / budget) * 100);

  if (percent >= 90) return { percent, status: "danger", color: "var(--danger)" };
  if (percent >= 70) return { percent, status: "warning", color: "var(--warning)" };
  return { percent, status: "safe", color: "var(--success)" };
}

/**
 * Current month aur year
 */
export function getCurrentMonthYear() {
  const now = new Date();
  return {
    month: now.getMonth() + 1, // 1-12
    year: now.getFullYear(),
  };
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
