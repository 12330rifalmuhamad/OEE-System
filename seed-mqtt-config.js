const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function run() {
  try {
    // Delete existing config if any
    await prisma.mqttConfig.deleteMany({
      where: { machineId: 1 }
    });

    const config = await prisma.mqttConfig.create({
      data: {
        companyId: 1,
        machineId: 1,
        brokerUrl: "mqtt://broker.hivemq.com:1883",
        clientId: "kmi_oee_filling_test_client",
        counterTopic: "kmi/lineA4/counter",
        statusTopic: "kmi/lineA4/status",
        statusRunValue: "RUN",
        statusStopValue: "STOP",
      }
    });

    console.log("MQTT Configuration Seeded successfully!");
    console.log(config);
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
