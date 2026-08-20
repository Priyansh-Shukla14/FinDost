import ComingSoon from "@/app/components/ComingSoon";

export const metadata = { title: "80C Tax Saver — FinDost" };

export default function TaxPage() {
  return (
    <ComingSoon
      icon="📋"
      title="80C Tax Saver"
      phase="Phase 7"
      description="PPF, ELSS, LIC, NPS — a full year of Section 80C investments in one place, with your remaining headroom against the ₹1.5 lakh limit always visible."
      points={[
        "Progress against the ₹1,50,000 limit",
        "Breakdown by type (PPF / ELSS / LIC / NPS)",
        "Organised by financial year",
        "Everything in one place at tax time",
      ]}
    />
  );
}
