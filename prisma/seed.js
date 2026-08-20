// Seed script — inserts the default categories into the database.
// Run: npx prisma db seed
//
// Note: the schema has @@unique([name, userId]), but system categories have a
// NULL userId, and Postgres treats two NULLs as distinct. That makes upsert()
// useless here (every run created duplicates). Instead: findFirst, then
// update or create.
//
// `previousNames` lets a category be renamed without breaking anything. The
// lookup falls back to the old names and renames the existing row in place,
// so its id is preserved and every expense and budget stays linked to it.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const defaultCategories = [
  { name: "Tea & Snacks", emoji: "☕", color: "#f59e0b", previousNames: ["Chai-Nashta"] },
  { name: "Food & Dining", emoji: "🍛", color: "#ef4444", previousNames: ["Khana-Peena"] },
  { name: "Transport", emoji: "🛺", color: "#f97316", previousNames: ["Auto-Rickshaw"] },
  { name: "Mobile & Internet", emoji: "📱", color: "#3b82f6", previousNames: ["Recharge"] },
  { name: "Shopping", emoji: "🛍️", color: "#ec4899" },
  { name: "EMI & Loans", emoji: "🏦", color: "#6366f1", previousNames: ["EMI"] },
  { name: "Entertainment", emoji: "🎬", color: "#8b5cf6" },
  { name: "Education", emoji: "📚", color: "#14b8a6", previousNames: ["Padhai"] },
  { name: "Health", emoji: "💊", color: "#22c55e" },
  { name: "Rent", emoji: "🏠", color: "#0ea5e9" },
  { name: "Travel", emoji: "✈️", color: "#06b6d4" },
  { name: "Groceries", emoji: "🥦", color: "#84cc16" },
  { name: "Other", emoji: "📦", color: "#6b7280", previousNames: ["Doosra"] },
];

async function main() {
  console.log("Seeding default categories...\n");

  let created = 0;
  let updated = 0;
  let renamed = 0;

  for (const category of defaultCategories) {
    const names = [category.name, ...(category.previousNames || [])];

    // System defaults have userId NULL, and findFirst is used because a
    // unique constraint is not reliable against NULL.
    const existing = await prisma.category.findFirst({
      where: { name: { in: names }, userId: null },
      orderBy: { id: "asc" },
    });

    if (existing) {
      const wasRenamed = existing.name !== category.name;

      await prisma.category.update({
        where: { id: existing.id },
        data: {
          name: category.name,
          emoji: category.emoji,
          color: category.color,
          isDefault: true,
        },
      });

      if (wasRenamed) {
        renamed++;
        console.log(`  ${category.emoji} ${existing.name} -> ${category.name} (renamed)`);
      } else {
        updated++;
        console.log(`  ${category.emoji} ${category.name} (already present)`);
      }
    } else {
      await prisma.category.create({
        data: {
          name: category.name,
          emoji: category.emoji,
          color: category.color,
          isDefault: true,
          userId: null,
        },
      });
      created++;
      console.log(`  ${category.emoji} ${category.name} (created)`);
    }
  }

  // Older buggy seed runs may have left duplicates behind — report them
  const systemCategories = await prisma.category.findMany({
    where: { userId: null },
    select: { name: true },
  });

  const counts = systemCategories.reduce((acc, c) => {
    acc[c.name] = (acc[c.name] || 0) + 1;
    return acc;
  }, {});

  const duplicates = Object.entries(counts).filter(([, n]) => n > 1);

  console.log(
    `\nSeeding complete — ${created} created, ${renamed} renamed, ${updated} unchanged.`
  );

  if (duplicates.length > 0) {
    console.log("\nDuplicate categories left over from older seed runs:");
    duplicates.forEach(([name, n]) => console.log(`     ${name} x ${n}`));
    console.log(
      "     Removing them means moving their expenses and budgets onto a single\n" +
        "     category first, so this script does not delete anything itself."
    );
  }
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
