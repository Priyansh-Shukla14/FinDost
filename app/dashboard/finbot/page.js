// FinBot page (phase 5)

import { requirePageUserId } from "@/lib/session";
import { getAIQuota } from "@/lib/ai/rateLimit";
import { isAIConfigured } from "@/lib/ai/gemini";
import FinBotChat from "./FinBotChat";

export const metadata = { title: "FinBot — FinDost" };

export default async function FinBotPage() {
  const userId = await requirePageUserId();
  const quota = await getAIQuota(userId);
  const configured = isAIConfigured();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">🤖 FinBot</h1>
          <p className="page-subtitle">
            Ask about your spending in plain language — answers come from your real data
          </p>
        </div>
      </div>

      {!configured ? (
        <div className="card card-padded">
          <div className="empty-state">
            <div className="empty-state-icon">🔌</div>
            <div className="empty-state-title">FinBot is not configured</div>
            <div className="empty-state-desc">
              Add a <code>GEMINI_API_KEY</code> to the environment and restart the app.
            </div>
          </div>
        </div>
      ) : (
        <FinBotChat quota={quota} />
      )}
    </div>
  );
}
