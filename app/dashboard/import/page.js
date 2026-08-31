// CSV import page — server component
// Only supplies the category list; all the parsing happens in the browser.

import { prisma } from "@/lib/prisma";
import { requirePageUserId } from "@/lib/session";
import CsvImporter from "./CsvImporter";

export const metadata = { title: "Import CSV — FinDost" };

export default async function ImportPage() {
  const userId = await requirePageUserId();

  const categories = await prisma.category.findMany({
    where: { OR: [{ isDefault: true }, { userId }] },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    select: { id: true, name: true, emoji: true },
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">📥 Import from CSV</h1>
          <p className="page-subtitle">
            Bring in a bank or UPI statement instead of typing it all out
          </p>
        </div>
      </div>

      <CsvImporter categories={categories} />
    </div>
  );
}
