// NextAuth configuration — supports Google OAuth and email/password login.

import { PrismaAdapter } from "@auth/prisma-adapter";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authOptions = {
  adapter: PrismaAdapter(prisma),

  providers: [
    // Google OAuth login
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      // If an account was created with email/password and the same person
      // later signs in with Google, link the two instead of failing with
      // OAuthAccountNotLinked and leaving them stuck. Google verifies the
      // email address, so this is safe.
      allowDangerousEmailAccountLinking: true,
    }),

    // Email + password login
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        // Emails are always stored trimmed and lowercased (see the signup route)
        const email = credentials.email.trim().toLowerCase();

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.password) {
          throw new Error("No account found with this email");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Incorrect password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          plan: user.plan,
        };
      },
    }),
  ],

  // JWT strategy — works with both Google and Credentials
  session: {
    strategy: "jwt",
  },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.id = user.id;
        token.plan = user.plan || "free";
      }

      // On useSession().update(), re-read the plan from the database —
      // otherwise the token keeps saying "free" after a Pro upgrade
      if (trigger === "update" && token.id) {
        const fresh = await prisma.user.findUnique({
          where: { id: token.id },
          select: { plan: true, name: true, image: true },
        });
        if (fresh) {
          token.plan = fresh.plan;
          token.name = fresh.name;
          token.picture = fresh.image;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id;
        session.user.plan = token.plan;
      }
      return session;
    },
  },
};
