const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixLog172() {
  const now = new Date("2026-08-21T03:18:55.901Z"); // end at start of next log
  const log = await prisma.activityLog.findUnique({ where: { id: 172 } });
  if (log && log.endTime === null) {
    const start = new Date(log.startTime);
    const dur = parseFloat(((now - start) / 60000).toFixed(2));
    await prisma.activityLog.update({
      where: { id: 172 },
      data: { endTime: now, duration: dur > 0 ? dur : 0.01 }
    });
    console.log(`Closed dangling open log ID 172 with duration ${dur} mins.`);
  } else {
    console.log("Log 172 is already closed or not found.");
  }
  await prisma.$disconnect();
}

fixLog172().catch(console.error);
