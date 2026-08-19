import ComingSoon from "@/app/components/ComingSoon";

export const metadata = { title: "Dream Goals — FinDost" };

export default function GoalsPage() {
  return (
    <ComingSoon
      icon="🌟"
      title="Dream Goals"
      phase="Phase 7"
      description="Goa trip, naya phone, emergency fund — target set karo, har mahine paise daalo, aur progress bar bharta hua dekho."
      points={[
        "Target amount + deadline",
        "Har contribution ke saath progress bar",
        "Goal poora hone pe celebration 🎉",
        "Dashboard pe chalu goals ki jhalak",
      ]}
    />
  );
}
