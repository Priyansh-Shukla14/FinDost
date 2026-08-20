"use client";

// AuthProvider — makes the session available across the whole app.
// Anything wrapped by this can call useSession().

import { SessionProvider } from "next-auth/react";

export default function AuthProvider({ children }) {
  return <SessionProvider>{children}</SessionProvider>;
}
