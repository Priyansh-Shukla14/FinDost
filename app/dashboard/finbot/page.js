import ComingSoon from "@/app/components/ComingSoon";

export const metadata = { title: "FinBot — FinDost" };

export default function FinBotPage() {
  return (
    <ComingSoon
      icon="🤖"
      title="FinBot"
      phase="Phase 5"
      description="Apne kharche ke baare mein normal baat-cheet mein poocho — 'is mahine khane pe kitna gaya?' FinBot tere asli data se jawab dega, andaaza nahi lagayega."
      points={[
        "Function calling — bot server pe teri hi query chalayega",
        "Sirf tera data: har query session.user.id se scoped",
        "Dashboard ke numbers se bilkul match karega",
        "Free plan pe roz ki message limit",
      ]}
    />
  );
}
