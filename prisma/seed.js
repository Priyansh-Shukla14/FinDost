// 🌱 Seed Script — Default Indian categories daalega database mein
// Run: npx prisma db seed
//
// ⚠️ Note: schema mein @@unique([name, userId]) hai, par system categories ka
// userId NULL hota hai — aur Postgres do NULL ko "alag" maanta hai. Isliye
// upsert() yahan kaam nahi karta (har run pe duplicate ban jaate the).
// Solution: pehle findFirst se dhoondo, phir update ya create karo.

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const defaultCategories = [
  { name: "Chai-Nashta", emoji: "☕", color: "#f59e0b" },
  { name: "Khana-Peena", emoji: "🍛", color: "#ef4444" },
  { name: "Auto-Rickshaw", emoji: "🛺", color: "#f97316" },
  { name: "Recharge", emoji: "📱", color: "#3b82f6" },
  { name: "Shopping", emoji: "🛍️", color: "#ec4899" },
  { name: "EMI", emoji: "🏦", color: "#6366f1" },
  { name: "Entertainment", emoji: "🎬", color: "#8b5cf6" },
  { name: "Padhai", emoji: "📚", color: "#14b8a6" },
  { name: "Health", emoji: "💊", color: "#22c55e" },
  { name: "Rent", emoji: "🏠", color: "#0ea5e9" },
  { name: "Travel", emoji: "✈️", color: "#06b6d4" },
  { name: "Groceries", emoji: "🥦", color: "#84cc16" },
  { name: "Doosra", emoji: "📦", color: "#6b7280" },
];

async function main() {
  console.log("🌱 Seeding default categories...\n");

  let created = 0;
  let updated = 0;

  for (const category of defaultCategories) {
    // System default = userId NULL. findFirst kyunki NULL pe unique constraint
    // reliable nahi hai.
    const existing = await prisma.category.findFirst({
      where: { name: category.name, userId: null },
      orderBy: { id: "asc" },
    });

    if (existing) {
      await prisma.category.update({
        where: { id: existing.id },
        data: {
          emoji: category.emoji,
          color: category.color,
          isDefault: true,
        },
      });
      updated++;
      console.log(`  ♻️  ${category.emoji} ${category.name} (already there)`);
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
      console.log(`  ✅ ${category.emoji} ${category.name}`);
    }
  }

  // Purane buggy seed runs ne duplicates banaye ho sakte hain — bata do
  const systemCategories = await prisma.category.findMany({
    where: { userId: null },
    select: { name: true },
  });

  const counts = systemCategories.reduce((acc, c) => {
    acc[c.name] = (acc[c.name] || 0) + 1;
    return acc;
  }, {});

  const duplicates = Object.entries(counts).filter(([, n]) => n > 1);

  console.log(`\n🎉 Seeding complete — ${created} naye, ${updated} update hue.`);

  if (duplicates.length > 0) {
    console.log("\n⚠️  Purane seed runs se duplicate categories mili hain:");
    duplicates.forEach(([name, n]) => console.log(`     ${name} × ${n}`));
    console.log(
      "     Inhe hataane se pehle expenses/budgets ko ek category pe move karna padega —\n" +
        "     isliye script khud delete nahi kar rahi."
    );
  }
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
