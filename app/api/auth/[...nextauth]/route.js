// NextAuth API route — handles login, logout and session
// URL: /api/auth/...

import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
