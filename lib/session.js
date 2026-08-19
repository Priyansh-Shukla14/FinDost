// 🔐 Session helper — har server action / page isi se userId leta hai
// Rule: userId kabhi bhi form ya URL se nahi, hamesha session se.

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";

/**
 * Server actions ke liye — session nahi toh error, jo action gracefully
 * catch karke user ko message dikhata hai.
 */
export async function requireUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Login karo pehle!");
  }
  return session.user.id;
}

/**
 * Pages ke liye — session nahi toh seedha /login.
 * (Layout aur page Next.js mein saath chalte hain, isliye page ko bhi apna
 * guard chahiye — warna layout redirect karte waqt page throw kar deta hai.)
 */
export async function requirePageUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

export async function getSessionUser() {
  const session = await getServerSession(authOptions);
  return session?.user || null;
}
