// 📝 Signup API Route
// POST /api/auth/signup — Creates new user with email + password

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { signupSchema, firstError } from "@/lib/validations";

// Bahut simple in-memory rate limit — ek IP se 5 signup attempts / 10 min.
// (Serverless pe per-instance hai; asli rate limiting Phase 6 mein Redis se.)
const attempts = new Map();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const hits = (attempts.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  attempts.set(ip, hits);

  // Map ko badhne se roko
  if (attempts.size > 5000) attempts.clear();

  return hits.length > MAX_ATTEMPTS;
}

export async function POST(request) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again in a few minutes." },
        { status: 429 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Server-side validation — client pe kuch bhi ho, yahan pakka check
    const result = signupSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: firstError(result, "Invalid input") },
        { status: 400 }
      );
    }

    const { name, email, password } = result.data; // email already lowercased

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: { name, email, password: hashedPassword },
    });

    return NextResponse.json(
      { message: "Account created successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    // Race condition: do requests ek saath aaye toh unique constraint chalega
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
