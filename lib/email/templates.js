// Email templates.
//
// Plain string templates rather than a rendering library — these are the only
// two emails the app sends, and inlined styles are what email clients actually
// support. Gmail strips <style> blocks, so every rule sits on the element.

import { formatCurrency } from "@/lib/utils";

const BRAND = "#10b981";
const DANGER = "#ef4444";
const WARNING = "#f59e0b";
const TEXT = "#0f172a";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";

// Anything that reaches an email body could contain a user-typed category
// name, so escape it rather than trusting it.
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(innerHtml) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid ${BORDER};border-radius:14px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;border-bottom:1px solid ${BORDER};">
                <div style="font-size:1.1rem;font-weight:700;color:${TEXT};">💰 FinDost</div>
              </td>
            </tr>
            ${innerHtml}
          </table>
          <div style="max-width:520px;margin-top:16px;font-size:0.75rem;color:${MUTED};text-align:center;">
            You are getting this because you set a budget in FinDost.
          </div>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

/**
 * Budget alert — sent once per budget per month, the first time spending
 * crosses the threshold.
 *
 * `crossed` is [{ categoryName, emoji, budgetAmount, spentAmount, percent }]
 * with all amounts in paise.
 */
export function budgetAlertEmail({ userName, crossed, monthLabel, dashboardUrl }) {
  const firstName = escapeHtml((userName || "there").split(" ")[0]);
  const isOver = crossed.some((c) => c.percent >= 100);

  const heading = isOver
    ? "You have gone past a budget"
    : "You are close to a budget limit";

  const rows = crossed
    .map((c) => {
      const color = c.percent >= 100 ? DANGER : WARNING;
      const barWidth = Math.min(c.percent, 100);
      return `
        <tr>
          <td style="padding:14px 0;border-bottom:1px solid ${BORDER};">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="font-size:0.9rem;font-weight:600;color:${TEXT};">
                  ${escapeHtml(c.emoji)} ${escapeHtml(c.categoryName)}
                </td>
                <td align="right" style="font-size:0.9rem;font-weight:700;color:${color};">
                  ${c.percent}%
                </td>
              </tr>
            </table>
            <div style="height:8px;background:#f1f5f9;border-radius:99px;margin:8px 0 6px;">
              <div style="height:8px;width:${barWidth}%;background:${color};border-radius:99px;"></div>
            </div>
            <div style="font-size:0.78rem;color:${MUTED};">
              ${formatCurrency(c.spentAmount)} spent of ${formatCurrency(c.budgetAmount)}
            </div>
          </td>
        </tr>`;
    })
    .join("");

  return shell(`
    <tr>
      <td style="padding:28px;">
        <h1 style="margin:0 0 8px;font-size:1.15rem;color:${TEXT};">${heading}</h1>
        <p style="margin:0 0 22px;font-size:0.9rem;color:${MUTED};line-height:1.55;">
          Hi ${firstName}, here is where your ${escapeHtml(monthLabel)} budgets stand right now.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          ${rows}
        </table>
        <div style="margin-top:26px;">
          <a href="${dashboardUrl}" style="display:inline-block;background:${BRAND};color:#ffffff;text-decoration:none;font-size:0.88rem;font-weight:600;padding:11px 22px;border-radius:9px;">
            Open dashboard
          </a>
        </div>
        <p style="margin:22px 0 0;font-size:0.78rem;color:${MUTED};line-height:1.5;">
          This is a one-time notice per category, per month — we will not email
          you about the same budget again until ${escapeHtml(monthLabel)} is over.
        </p>
      </td>
    </tr>
  `);
}

export function budgetAlertSubject({ crossed, monthLabel }) {
  if (crossed.length === 1) {
    const c = crossed[0];
    const verb = c.percent >= 100 ? "over" : "at";
    return `${c.emoji} ${c.categoryName} is ${verb} ${c.percent}% of its ${monthLabel} budget`;
  }
  return `${crossed.length} budgets need a look — ${monthLabel}`;
}
