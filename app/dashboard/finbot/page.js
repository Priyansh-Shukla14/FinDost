import ComingSoon from "@/app/components/ComingSoon";

export const metadata = { title: "FinBot — FinDost" };

export default function FinBotPage() {
  return (
    <ComingSoon
      icon="🤖"
      title="FinBot"
      phase="Phase 5"
      description="Ask about your spending in plain language — 'how much went on food this month?' FinBot answers from your real data instead of guessing."
      points={[
        "Function calling — the bot runs your query on the server",
        "Your data only: every query is scoped to session.user.id",
        "Answers match the dashboard numbers exactly",
        "Daily message limit on the free plan",
      ]}
    />
  );
}
