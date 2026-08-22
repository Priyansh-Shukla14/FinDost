import "./globals.css";
import { Analytics } from "@vercel/analytics/next";
import AuthProvider from "@/app/components/AuthProvider";

export const metadata = {
  title: "FinDost — Your AI Finance Companion",
  description:
    "AI-powered personal finance tracker built for India. Track expenses, chat with your money via FinBot, set budgets, scan receipts, and build better financial habits.",
  keywords: ["finance tracker", "expense tracker", "India", "AI", "budget", "FinBot"],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>💰</text></svg>"
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
        {/* Vercel Web Analytics — page views and visitor counts.
            Sends no data until it is enabled in the Vercel dashboard. */}
        <Analytics />
      </body>
    </html>
  );
}
