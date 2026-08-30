// Session helpers — every server action and page gets its userId from here.
// Rule: userId never comes from a form or the URL, always from the session.

import { cache } from "react";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

/**
 * One session read per request.
 *
 * The dashboard layout and the page inside it both need the session, and the
 * page often needs both the id and the user object. Without this, a single
 * page load decoded and verified the JWT three separate times. React's cache()
 * dedupes those into one call for the lifetime of the request.
 */
const getSession = cache(() => getServerSession(authOptions));

/**
 * For server actions — throws when there is no session, which the calling
 * action catches and turns into a friendly message for the user.
 */
export async function requireUserId() {
  const session = await getSession();
  if (!session?.user?.id) {
    throw new Error("Please sign in first");
  }
  return session.user.id;
}

/**
 * For pages — redirects straight to /login when there is no session.
 * (Next.js renders the layout and the page together, so the page needs its
 * own guard; otherwise it throws while the layout is still redirecting.)
 */
export async function requirePageUserId() {
  const session = await getSession();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

export async function getSessionUser() {
  const session = await getSession();
  return session?.user || null;
}
