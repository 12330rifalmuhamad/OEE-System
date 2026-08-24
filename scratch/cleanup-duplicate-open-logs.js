const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function cleanupDuplicateOpenLogs() {
  console.log("Cleaning up duplicate open activity logs per machine...");
  
  const openLogs = await prisma.activityLog.findMany({
    where: { endTime: null },
    orderBy: { id: 'desc' },
    include: {
      activityCode: { include: { category: true } },
      okpLog: true
    }
  });

  console.log(`Found ${openLogs.length} currently open activity logs in total.`);

  const now = new Date();

  // Group non-PR logs by machine name
  const machineOpenLogs = {};

  for (const log of openLogs) {
    const isPR = log.activityCode?.category?.code === 'PR';
    if (isPR) continue; // Keep PR open log

    let machName = 'Unknown Machine';
    if (log.brRootCause) {
      const match = log.brRootCause.match(/\[(.*?)\]/);
      if (match && match[1]) {
        machName = match[1].replace(/ (Partial|Full Line) Downtime.*/i, '').trim();
      }
    }

    if (!machineOpenLogs[machName]) {
      machineOpenLogs[machName] = [];
    }
    machineOpenLogs[machName].push(log);
  }

  for (const [machName, logs] of Object.entries(machineOpenLogs)) {
    if (logs.length > 1) {
      console.log(`Machine '${machName}' has ${logs.length} open logs. Closing older duplicates...`);
      // Keep the newest (highest ID), close older ones
      const duplicates = logs.slice(1);
      for (const dup of duplicates) {
        const start = dup.startTime || dup.createdAt || now;
        let durationMin = parseFloat(((now - start) / 60000).toFixed(2));
        if (isNaN(durationMin) || durationMin <= 0) durationMin = 0.01;

        await prisma.activityLog.update({
          where: { id: dup.id },
          data: {
            endTime: now,
            duration: durationMin,
            brRootCause: dup.brRootCause ? `${dup.brRootCause} (Auto-closed Duplicate)` : "Auto-closed Duplicate"
          }
        });
        console.log(`Closed duplicate open log ID ${dup.id} for machine '${machName}'`);
      }
    }
  }

  console.log("Cleanup complete!");
  await prisma.$disconnect();
}

cleanupDuplicateOpenLogs().catch(err => {
  console.error("Cleanup error:", err);
  prisma.$disconnect();
});
