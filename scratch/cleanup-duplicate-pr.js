const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function cleanupDuplicatePrLogs() {
  try {
    // Find all OKPs with open PR logs
    const openPrLogs = await prisma.activityLog.findMany({
      where: {
        endTime: null,
        activityCode: { category: { code: "PR" } }
      },
      orderBy: { id: "asc" }
    });

    console.log(`Found ${openPrLogs.length} open PR logs total.`);

    // Group by okpLogId
    const okpGroup = {};
    openPrLogs.forEach(log => {
      if (!okpGroup[log.okpLogId]) okpGroup[log.okpLogId] = [];
      okpGroup[log.okpLogId].push(log);
    });

    let closedCount = 0;
    for (const okpId of Object.keys(okpGroup)) {
      const logs = okpGroup[okpId];
      if (logs.length > 1) {
        console.log(`OKP ${okpId} has ${logs.length} open PR logs! Cleaning up duplicates...`);
        // Keep the last one open, close earlier ones with 0 duration or duration up to last one's startTime
        const lastLog = logs[logs.length - 1];
        for (let i = 0; i < logs.length - 1; i++) {
          const dupLog = logs[i];
          const endTime = lastLog.startTime || new Date();
          const start = dupLog.startTime || dupLog.createdAt || endTime;
          let dur = parseFloat(((endTime - start) / 60000).toFixed(2));
          if (isNaN(dur) || dur < 0) dur = 0;

          await prisma.activityLog.update({
            where: { id: dupLog.id },
            data: {
              endTime: endTime,
              duration: dur
            }
          });
          console.log(`Closed duplicate open PR log ID ${dupLog.id} for OKP ${okpId}.`);
          closedCount++;
        }
      }
    }

    console.log(`Cleanup complete! Closed ${closedCount} duplicate open PR logs.`);
  } catch (err) {
    console.error("Error during cleanup:", err);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupDuplicatePrLogs();
