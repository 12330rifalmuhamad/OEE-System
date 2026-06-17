const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const okpLogs = await prisma.okpLog.findMany({
    include: {
      machine: {
        include: { lineProcess: true }
      },
      product: true,
      activities: {
        orderBy: { id: "desc" },
        include: {
          activityCode: {
            include: { category: true }
          }
        }
      }
    },
    orderBy: { date: "desc" },
    take: 5
  });

  console.log("=== LATEST OKP LOGS & THEIR ACTIVITIES ===");
  for (const log of okpLogs) {
    console.log(`\nOKP: ${log.okpNumber}`);
    console.log(`Machine: ${log.machine.name} (Line: ${log.machine.lineProcess?.name || 'None'})`);
    console.log(`Product: ${log.product.name} | Total Output: ${log.totalOutput} CB`);
    console.log(`OEE Metrics: Availability=${log.availability}%, Performance=${log.performance}%, Quality=${log.quality}%, OEE=${log.oee}%`);
    console.log(`Activities (latest 5):`);
    log.activities.slice(0, 5).forEach(act => {
      console.log(`  - [ID: ${act.id}] Code: ${act.activityCode.code} (${act.activityCode.category.code}) | Start: ${act.startTime?.toISOString()} | End: ${act.endTime?.toISOString() || 'NULL'} | Duration: ${act.duration} mins | Root Cause: ${act.brRootCause}`);
    });
  }

  await prisma.$disconnect();
}

run();
