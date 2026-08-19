// 🔐 NextAuth Configuration
// Google OAuth + Email/Password login support

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
      // Agar user pehle email/password se bana hai aur ab usi email pe Google
      // se aata hai, toh dono ko link kar do — warna OAuthAccountNotLinked
      // error aata hai aur user phas jaata hai. Google email verify karta hai,
      // isliye ye safe hai.
      allowDangerousEmailAccountLinking: true,
    }),

    // Email + Password login
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

        // Email hamesha lowercase+trimmed store hoti hai (signup route dekho)
        const email = credentials.email.trim().toLowerCase();

        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.password) {
          throw new Error("No account found with this email");
        }

        // Compare password
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

      // useSession().update() call hone pe plan DB se dobara padho —
      // warna Pro upgrade ke baad bhi token "free" hi dikhata rahega
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
