import ComingSoon from "@/app/components/ComingSoon";

export const metadata = { title: "Subscriptions — FinDost" };

export default function SubscriptionsPage() {
  return (
    <ComingSoon
      icon="🔄"
      title="Subscriptions"
      phase="Phase 6"
      description="Netflix, Spotify, gym — jo har mahine apne aap kat jaata hai. App khud pehchanega ki kaunsa kharcha recurring hai aur poocha karega ki subscription bana dein?"
      points={[
        "Recurring payments auto-detect (same merchant, ~28–33 din)",
        "Har mahine ka total subscription burn",
        "Next due date ka reminder",
        "Tu confirm karega tabhi subscription banegi",
      ]}
    />
  );
}
