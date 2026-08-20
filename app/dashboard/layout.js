import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardChrome from "@/app/components/DashboardChrome";

export const metadata = {
  title: "Dashboard — FinDost",
};

export default async function DashboardLayout({ children }) {
  // Protected route — the dashboard does not open without a session
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // AuthProvider already wraps the root layout, so no need to wrap again
  return <DashboardChrome>{children}</DashboardChrome>;
}
