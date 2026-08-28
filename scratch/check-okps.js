const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const okps = await prisma.okpLog.findMany({
    where: {
      createdAt: {
        gte: today
      }
    },
    include: {
      machine: true,
      activities: {
        include: {
          activityCode: true
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  console.log(`=== OKP LOGS CREATED TODAY (${okps.length}) ===`);
  okps.forEach(o => {
    console.log(`ID: ${o.id} | OKP: ${o.okpNumber} | Machine: ${o.machine.name} | CreatedAt: ${o.createdAt.toISOString()} | Activities Count: ${o.activities.length}`);
    o.activities.forEach(a => {
      console.log(`  - Activity ID: ${a.id} | Code: ${a.activityCode.code} | Duration: ${a.duration} | EndTime: ${a.endTime}`);
    });
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
