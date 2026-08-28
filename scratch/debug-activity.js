const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function run() {
  const activities = await prisma.activityLog.findMany({
    where: {
      okpLogId: 121
    },
    orderBy: { id: "desc" },
    include: {
      activityCode: {
        include: {
          category: true
        }
      }
    }
  });
  console.log(`Found ${activities.length} activity logs:`);
  activities.forEach(act => {
    console.log(`ID: ${act.id} | Code: ${act.activityCode.code} (${act.activityCode.category.code}) | Start: ${act.startTime.toISOString()} | End: ${act.endTime ? act.endTime.toISOString() : 'NULL'} | Duration: ${act.duration}`);
  });
  await prisma.$disconnect();
}
run();
