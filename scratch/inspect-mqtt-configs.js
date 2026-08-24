const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function inspectMqttConfigs() {
  try {
    const configs = await prisma.mqttConfig.findMany({
      include: { machine: true }
    });
    console.log("=== MQTT CONFIGS ===");
    configs.forEach(c => {
      console.log({
        id: c.id,
        machineId: c.machineId,
        machineName: c.machine ? c.machine.name : null,
        lineProcessId: c.machine ? c.machine.lineProcessId : null,
        brokerUrl: c.brokerUrl,
        clientId: c.clientId,
        statusTopic: c.statusTopic,
        counterTopic: c.counterTopic,
      });
    });
  } catch (err) {
    console.error("Error inspecting configs:", err);
  } finally {
    await prisma.$disconnect();
  }
}

inspectMqttConfigs();
