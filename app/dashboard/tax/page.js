import ComingSoon from "@/app/components/ComingSoon";

export const metadata = { title: "80C Tax Saver — FinDost" };

export default function TaxPage() {
  return (
    <ComingSoon
      icon="📋"
      title="80C Tax Saver"
      phase="Phase 7"
      description="PPF, ELSS, LIC, NPS — saal bhar ka 80C investment ek jagah. ₹1.5 lakh ki limit ke against kitna bacha hai, hamesha pata rahega."
      points={[
        "₹1,50,000 limit ke against progress",
        "Type-wise breakdown (PPF / ELSS / LIC / NPS)",
        "Financial year ke hisaab se",
        "Tax season pe ek hi jagah se saara data",
      ]}
    />
  );
}
