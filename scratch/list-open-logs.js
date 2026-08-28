const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function listOpenLogs() {
  const openLogs = await prisma.activityLog.findMany({
    where: { endTime: null },
    orderBy: { id: 'desc' },
    include: {
      activityCode: { include: { category: true } }
    }
  });

  console.log("=== CURRENT OPEN ACTIVITY LOGS IN DB ===");
  openLogs.forEach(l => {
    console.log(`ID: ${l.id} | OKP: ${l.okpLogId} | Start: ${l.startTime?.toISOString()} | Code: ${l.activityCode?.code} (${l.activityCode?.category?.code}) | Cause: ${l.brRootCause}`);
  });

  await prisma.$disconnect();
}

listOpenLogs().catch(console.error);
