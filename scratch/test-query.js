const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const dateStr = "2026-06-09";
  const dateFilter = {
    gte: new Date(dateStr),
    lte: new Date(dateStr)
  };
  
  console.log("Querying with date range:", dateFilter);
  const logs = await prisma.okpLog.findMany({
    where: {
      date: dateFilter
    }
  });
  console.log(`Found ${logs.length} logs with exact date query.`);

  const allLogs = await prisma.okpLog.findMany({
    take: 5,
    select: {
      id: true,
      okpNumber: true,
      date: true
    }
  });
  console.log("Sample logs in DB:");
  allLogs.forEach(l => {
    console.log(`- ${l.okpNumber}: ${l.date.toISOString()}`);
  });

  // Query with proper day boundary
  const startOfDay = new Date(dateStr);
  startOfDay.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(dateStr);
  endOfDay.setUTCHours(23, 59, 59, 999);
  
  const correctFilter = {
    gte: startOfDay,
    lte: endOfDay
  };
  console.log("Querying with correct date range:", correctFilter);
  const correctLogs = await prisma.okpLog.findMany({
    where: {
      date: correctFilter
    }
  });
  console.log(`Found ${correctLogs.length} logs with correct date query.`);

  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
