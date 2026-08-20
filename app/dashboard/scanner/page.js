import ComingSoon from "@/app/components/ComingSoon";

export const metadata = { title: "Receipt Scanner — FinDost" };

export default function ScannerPage() {
  return (
    <ComingSoon
      icon="📸"
      title="Receipt Scanner"
      phase="Phase 5"
      description="Take a photo of a bill — the amount, date and merchant name are pulled out automatically, and the expense form arrives pre-filled."
      points={[
        "Merchant, amount and date from a vision model",
        "Saved only after passing Zod validation",
        "Form pre-filled — just review it and hit Add",
        "Anything read incorrectly can be fixed by hand",
      ]}
    />
  );
}
