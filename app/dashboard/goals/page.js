import ComingSoon from "@/app/components/ComingSoon";

export const metadata = { title: "Dream Goals — FinDost" };

export default function GoalsPage() {
  return (
    <ComingSoon
      icon="🌟"
      title="Dream Goals"
      phase="Phase 7"
      description="A trip, a new phone, an emergency fund — set a target, put money aside each month, and watch the progress bar fill up."
      points={[
        "Target amount and deadline",
        "Progress bar updated with every contribution",
        "A celebration when a goal is completed 🎉",
        "Active goals summarised on the dashboard",
      ]}
    />
  );
}
