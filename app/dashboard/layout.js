import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import DashboardChrome from "@/app/components/DashboardChrome";

export const metadata = {
  title: "Dashboard — FinDost",
};

export default async function DashboardLayout({ children }) {
  // 🔒 PROTECTED ROUTE — bina login ke dashboard nahi khulega!
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/login");
  }

  // AuthProvider root layout mein already hai — dobara wrap karne ki zaroorat nahi
  return <DashboardChrome>{children}</DashboardChrome>;
}
