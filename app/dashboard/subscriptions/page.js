import ComingSoon from "@/app/components/ComingSoon";

export const metadata = { title: "Subscriptions — FinDost" };

export default function SubscriptionsPage() {
  return (
    <ComingSoon
      icon="🔄"
      title="Subscriptions"
      phase="Phase 6"
      description="Netflix, Spotify, the gym — everything that quietly renews each month. The app spots which expenses look recurring and asks whether to track them as subscriptions."
      points={[
        "Auto-detect recurring payments (same merchant, ~28-33 days)",
        "Your total monthly subscription burn",
        "Reminders for the next due date",
        "Nothing is created until you confirm it",
      ]}
    />
  );
}
