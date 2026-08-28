const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  console.log("=== MQTT CONFIGS ===");
  const configs = await prisma.mqttConfig.findMany({
    include: {
      machine: true,
    },
  });
  console.log(JSON.stringify(configs, null, 2));

  console.log("\n=== OKP LOGS ===");
  const okpLogs = await prisma.okpLog.findMany({
    orderBy: { date: "desc" },
    take: 5,
  });
  console.log(JSON.stringify(okpLogs, null, 2));

  console.log("\n=== ACTIVITY LOGS ===");
  for (const config of configs) {
    const logs = await prisma.activityLog.findMany({
      where: {
        okpLog: {
          machineId: config.machineId,
        },
      },
      orderBy: { id: "desc" },
      take: 2,
      include: {
        activityCode: {
          include: {
            category: true,
          },
        },
      },
    });
    console.log(`Machine: ${config.machine.name} (ID: ${config.machineId})`);
    console.log(JSON.stringify(logs, null, 2));
  }

  await prisma.$disconnect();
}

run();
