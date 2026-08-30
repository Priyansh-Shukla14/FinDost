// Daily budget alert cron.
//
// Vercel Cron calls this once a day with an
// "Authorization: Bearer <CRON_SECRET>" header, which it adds automatically
// when CRON_SECRET is set in the project's environment variables.
//
// The endpoint is public by URL, so the secret is the only thing standing
// between a stranger and the ability to burn the whole email quota. It fails
// closed: no CRON_SECRET configured means nobody gets in, including Vercel.

import { timingSafeEqual } from "crypto";
import { runBudgetAlerts } from "@/lib/alerts/budgetAlerts";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Constant-time compare so the response time cannot be used to guess the
// secret one character at a time
function secretMatches(provided, expected) {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(request) {
  const expected = process.env.CRON_SECRET;

  if (!expected) {
    console.error("Budget alert cron called but CRON_SECRET is not set");
    return Response.json(
      { error: "Cron is not configured on this deployment." },
      { status: 503 }
    );
  }

  const header = request.headers.get("authorization") || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";

  if (!token || !secretMatches(token, expected)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ?dryRun=1 works out exactly who would be emailed and sends nothing.
  // Lets the job be checked against real data before a Resend key exists, and
  // still needs the secret, so it is no weaker than the real run.
  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";

  try {
    const summary = await runBudgetAlerts({ dryRun });
    console.log("Budget alerts:", JSON.stringify(summary));
    return Response.json(summary);
  } catch (err) {
    console.error("Budget alert cron failed:", err);
    return Response.json({ error: "The alert job failed." }, { status: 500 });
  }
}
