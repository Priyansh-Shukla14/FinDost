import ComingSoon from "@/app/components/ComingSoon";

export const metadata = { title: "Upgrade to Pro — FinDost" };

export default function UpgradePage() {
  return (
    <ComingSoon
      icon="✨"
      title="FinDost Pro"
      phase="Phase 7"
      description="Core features hamesha free rahenge. Pro un logon ke liye hai jinhe unlimited FinBot aur har mahine PDF report chahiye — ₹99/month."
      points={[
        "Unlimited FinBot messages",
        "Har mahine PDF report email pe",
        "Razorpay se payment (pehle Test Mode)",
        "Free plan mein expenses, budgets, dashboard — sab included",
      ]}
    />
  );
}
