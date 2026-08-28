const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const lines = await prisma.lineProcess.findMany();
  const machines = await prisma.machine.findMany();
  console.log("=== LINI PRODUKSI ===");
  console.log(lines);
  console.log("=== MESIN ===");
  console.log(machines);
}

main().catch(console.error).finally(() => prisma.$disconnect());
