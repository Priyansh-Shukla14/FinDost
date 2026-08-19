import ComingSoon from "@/app/components/ComingSoon";

export const metadata = { title: "Receipt Scanner — FinDost" };

export default function ScannerPage() {
  return (
    <ComingSoon
      icon="📸"
      title="Receipt Scanner"
      phase="Phase 5"
      description="Bill ki photo kheencho — amount, date aur dukaan ka naam apne aap nikal aayega, aur expense form pehle se bhara mil jayega."
      points={[
        "Vision model se merchant + amount + date",
        "Zod se validate hone ke baad hi save",
        "Form pre-filled — tu bas check karke Add dabana",
        "Galat pada toh manually theek kar sakta hai",
      ]}
    />
  );
}
