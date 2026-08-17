import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import AuthProvider from "@/app/components/AuthProvider";
import Navbar from "@/app/components/Navbar";
import Sidebar from "@/app/components/Sidebar";

export const metadata = {
  title: "Dashboard — FinDost",
};

export default async function DashboardLayout({ children }) {
  // 🔒 PROTECTED ROUTE — bina login ke dashboard nahi khulega!
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <AuthProvider>
      <Navbar />
      <div className="dashboard-layout">
        <Sidebar />
        <main className="main-content">{children}</main>
      </div>
    </AuthProvider>
  );
}
