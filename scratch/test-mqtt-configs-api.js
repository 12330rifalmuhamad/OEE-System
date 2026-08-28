const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  const company = await prisma.company.findFirst();
  if (!company) {
    console.error("No company found.");
    process.exit(1);
  }
  const companyId = company.id;
  console.log(`Using companyId: ${companyId}`);

  const configs = await prisma.mqttConfig.findMany({
    where: { companyId },
    include: {
      machine: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  const enrichedConfigs = await Promise.all(
    configs.map(async (config) => {
      const openActivity = await prisma.activityLog.findFirst({
        where: {
          okpLog: {
            machineId: config.machineId
          },
          endTime: null
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

      let isRunning = 0;
      if (openActivity && openActivity.activityCode.category.code === "PR") {
        isRunning = 1;
      }

      return {
        id: config.id,
        name: config.machine.name,
        machineId: config.machineId,
        status: isRunning,
        openActivity: openActivity ? {
          id: openActivity.id,
          endTime: openActivity.endTime,
          code: openActivity.activityCode.code,
          category: openActivity.activityCode.category.code
        } : null
      };
    })
  );

  console.log(JSON.stringify(enrichedConfigs, null, 2));
  await prisma.$disconnect();
}

run();
