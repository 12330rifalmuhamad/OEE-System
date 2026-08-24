const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const okps = await prisma.okpLog.findMany({
    orderBy: { id: 'desc' },
    take: 5,
    include: {
      activities: {
        orderBy: { id: 'desc' },
        include: { activityCode: true }
      }
    }
  });

  for (const okp of okps) {
    console.log(`\n=== OKP ID: ${okp.id} | OKP Num: ${okp.okpNumber} | Status/Date: ${okp.date} ===`);
    console.log(`Activities count: ${okp.activities.length}`);
    for (const act of okp.activities) {
      console.log(` - ActID: ${act.id} | Code: ${act.activityCode ? act.activityCode.code : 'N/A'} | Start: ${act.startTime} | End: ${act.endTime} | Dur: ${act.duration}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
