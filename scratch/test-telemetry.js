const mqtt = require("mqtt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const statusTopic = "kmi/rifdiansyah_oee/lineA4/machine1/status";
const brokerUrl = "mqtt://broker.hivemq.com:1883";

async function checkStatus() {
  const machine = await prisma.machine.findFirst({
    where: { name: "Filling Line A4" },
  });
  if (!machine) {
    console.error("Filling Line A4 not found in database.");
    return null;
  }
  
  const openActivity = await prisma.activityLog.findFirst({
    where: {
      okpLog: {
        machineId: machine.id
      },
      endTime: null
    },
    include: {
      activityCode: {
        include: { category: true }
      }
    }
  });

  const isRunning = openActivity && openActivity.activityCode.category.code === "PR" ? 1 : 0;
  return {
    isRunning,
    code: openActivity ? openActivity.activityCode.code : null,
    category: openActivity ? openActivity.activityCode.category.code : null
  };
}

async function run() {
  console.log("Connecting to HiveMQ public broker...");
  const client = mqtt.connect(brokerUrl);

  client.on("connect", async () => {
    console.log("Connected successfully to HiveMQ broker.");
    
    // Initial status check
    const initial = await checkStatus();
    console.log("Initial machine status:", initial);

    // 1. Publish STOP (0)
    console.log(`Publishing STOP state (0) to topic: ${statusTopic}`);
    client.publish(statusTopic, "0", { qos: 1 });

    console.log("Waiting 4 seconds for backend to process...");
    await new Promise((resolve) => setTimeout(resolve, 4000));

    const afterStop = await checkStatus();
    console.log("Status after publishing STOP:", afterStop);

    // 2. Publish RUN (1)
    console.log(`Publishing RUN state (1) to topic: ${statusTopic}`);
    client.publish(statusTopic, "1", { qos: 1 });

    console.log("Waiting 4 seconds for backend to process...");
    await new Promise((resolve) => setTimeout(resolve, 4000));

    const afterRun = await checkStatus();
    console.log("Status after publishing RUN:", afterRun);

    client.end();
    await prisma.$disconnect();
    process.exit(0);
  });

  client.on("error", (err) => {
    console.error("MQTT client error:", err);
    client.end();
    process.exit(1);
  });
}

run();
