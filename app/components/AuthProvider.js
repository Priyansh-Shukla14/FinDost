"use client";

// 🔑 AuthProvider — Session ko poore app mein available karata hai
// Isse wrap karne se koi bhi component useSession() use kar sakta hai

import { SessionProvider } from "next-auth/react";

export default function AuthProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
