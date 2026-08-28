const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const cfgs = await prisma.mqttConfig.findMany({
    include: { machine: true }
  });
  console.log("=== MQTT CONFIGS ===");
  cfgs.forEach(c => {
    console.log(`ID: ${c.id} | MachineID: ${c.machineId} | Name: ${c.machine?.name} | statusTopic: ${c.statusTopic} | statusRunValue: '${c.statusRunValue}'`);
  });
  await prisma.$disconnect();
}

main().catch(err => {
  console.error(err);
  prisma.$disconnect();
});
