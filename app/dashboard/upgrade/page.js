import ComingSoon from "@/app/components/ComingSoon";

export const metadata = { title: "Upgrade to Pro — FinDost" };

export default function UpgradePage() {
  return (
    <ComingSoon
      icon="✨"
      title="FinDost Pro"
      phase="Phase 7"
      description="The core features stay free forever. Pro is for anyone who wants unlimited FinBot and a monthly PDF report — ₹99/month."
      points={[
        "Unlimited FinBot messages",
        "A monthly PDF report delivered by email",
        "Payments through Razorpay (test mode first)",
        "Expenses, budgets and the dashboard remain free",
      ]}
    />
  );
}
