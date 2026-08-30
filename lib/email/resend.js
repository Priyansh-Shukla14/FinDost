// Resend client.
//
// Everything provider-specific lives in this one file, so swapping to another
// email provider later means rewriting this file and nothing else. Same shape
// as lib/ai/gemini.js on purpose.

import { Resend } from "resend";

// Resend will only deliver mail from a domain you have verified. Until that is
// done, its shared onboarding sender works but delivers *only* to the address
// that owns the Resend account — fine for testing, useless for real users.
export const FROM_ADDRESS =
  process.env.EMAIL_FROM || "FinDost <onboarding@resend.dev>";

let client = null;

/**
 * Returns the shared Resend client, or null when no API key is configured.
 * Callers must handle null so the app still runs without email set up.
 */
export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;

  if (!client) {
    client = new Resend(apiKey);
  }
  return client;
}

export function isEmailConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

/**
 * Sends one email. Returns { sent: true } or { sent: false, error }.
 *
 * Never throws: the only caller is a cron job processing many users, and one
 * bad address must not stop everyone else's alerts from going out.
 */
export async function sendEmail({ to, subject, html }) {
  const resend = getResendClient();
  if (!resend) {
    return { sent: false, error: "RESEND_API_KEY is not configured" };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
    });

    if (error) {
      return { sent: false, error: error.message || "Resend rejected the email" };
    }
    return { sent: true, id: data?.id };
  } catch (err) {
    console.error("sendEmail failed:", err);
    return { sent: false, error: err.message || "Could not send the email" };
  }
}
