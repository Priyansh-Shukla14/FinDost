// 🌱 Seed Script — Default Indian categories daalega database mein
// Run: npx prisma db seed

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

  for (const category of defaultCategories) {
    const created = await prisma.category.upsert({
      where: {
        name_userId: {
          name: category.name,
          userId: "", // system default — no userId
        },
      },
      update: {},
      create: {
        name: category.name,
        emoji: category.emoji,
        color: category.color,
        isDefault: true,
        userId: null,
      },
    });
    console.log(`  ✅ ${created.emoji} ${created.name}`);
  }

  console.log("\n🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
