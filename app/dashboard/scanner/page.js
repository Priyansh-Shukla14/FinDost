// Receipt scanner page (phase 5)

import { prisma } from "@/lib/prisma";
import { requirePageUserId } from "@/lib/session";
import { getAIQuota } from "@/lib/ai/rateLimit";
import { isAIConfigured } from "@/lib/ai/gemini";
import ReceiptScanner from "./ReceiptScanner";

export const metadata = { title: "Receipt Scanner — FinDost" };

export default async function ScannerPage() {
  const userId = await requirePageUserId();

  const [categories, quota] = await Promise.all([
    prisma.category.findMany({
      where: { OR: [{ isDefault: true }, { userId }] },
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
      select: { id: true, name: true, emoji: true },
    }),
    getAIQuota(userId),
  ]);

  const configured = isAIConfigured();

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📸 Receipt Scanner</h1>
          <p className="page-subtitle">
            Photograph a bill and the amount, date and shop name get filled in for you
          </p>
        </div>
      </div>

      {!configured ? (
        <div className="card card-padded">
          <div className="empty-state">
            <div className="empty-state-icon">🔌</div>
            <div className="empty-state-title">The scanner is not configured</div>
            <div className="empty-state-desc">
              Add a <code>GEMINI_API_KEY</code> to the environment and restart the app.
            </div>
          </div>
        </div>
      ) : (
        <ReceiptScanner categories={categories} quota={quota} />
      )}
    </div>
  );
}
