import { requirePageUserId } from "@/lib/session";
import DashboardChrome from "@/app/components/DashboardChrome";

export const metadata = {
  title: "Dashboard — FinDost",
};

export default async function DashboardLayout({ children }) {
  // Protected route — the dashboard does not open without a session.
  // Goes through lib/session so the layout and the page inside it share a
  // single cached session read instead of decoding the JWT twice.
  await requirePageUserId();

  // AuthProvider already wraps the root layout, so no need to wrap again
  return <DashboardChrome>{children}</DashboardChrome>;
}
