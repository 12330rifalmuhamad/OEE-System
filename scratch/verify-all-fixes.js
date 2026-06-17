const mqtt = require("mqtt");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const statusTopic = "kmi/rifdiansyah_oee/lineA4/machine1/status";
const counterTopic = "kmi/rifdiansyah_oee/lineA4/machine1/counter";
const brokerUrl = "mqtt://broker.hivemq.com:1883";

async function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function verifyAll() {
  console.log("=== STEP 1: Initiating a new OKP on Filling Line A4 ===");
  const initiatePayload = {
    okpNumber: "OKP-TEST-VERIFY",
    machineName: "Filling Line A4",
    productCode: "CHIL-KID-800",
    shift: 1,
    groupLeader: "Verification Agent",
    operator: "Test Operator",
    helper: "Test Helper",
    loadingTime: 480.0
  };

  const res = await fetch("http://localhost:5001/api/transactions/okp/initiate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(initiatePayload)
  });

  if (res.status !== 201) {
    console.error(`❌ Failed to initiate OKP. Status: ${res.status}`);
    const errText = await res.text();
    console.error("Response:", errText);
    await prisma.$disconnect();
    process.exit(1);
  }

  const initResult = await res.json();
  const okpId = initResult.okpLogId;
  const okpNumber = initResult.okpNumber;
  console.log(`✅ OKP initiated successfully! ID: ${okpId}, Number: ${okpNumber}`);

  // Wait for things to settle
  await delay(2000);

  // Connect to MQTT broker
  console.log("\n=== STEP 2: Connecting to MQTT broker ===");
  const client = mqtt.connect(brokerUrl);

  client.on("connect", async () => {
    console.log("✅ Connected to HiveMQ Broker.");

    try {
      // Fetch initial OKP output
      let log = await prisma.okpLog.findUnique({ where: { id: okpId } });
      console.log(`Initial output count: ${log.totalOutput}`);

      // Test A: Send non-numeric counter pulse "on"
      console.log("\n=== TEST A: Publishing non-numeric payload 'on' to counter topic ===");
      client.publish(counterTopic, "on", { qos: 1 });
      await delay(2000);
      
      log = await prisma.okpLog.findUnique({ where: { id: okpId } });
      console.log(`Output count after 'on': ${log.totalOutput}`);
      if (log.totalOutput === 1) {
        console.log("✅ Success! Non-numeric trigger default of +1 worked.");
      } else {
        console.error(`❌ Failure! Expected 1, got ${log.totalOutput}`);
      }

      // Test B: Send empty counter pulse ""
      console.log("\n=== TEST B: Publishing empty payload '' to counter topic ===");
      client.publish(counterTopic, "", { qos: 1 });
      await delay(2000);
      
      log = await prisma.okpLog.findUnique({ where: { id: okpId } });
      console.log(`Output count after empty string: ${log.totalOutput}`);
      if (log.totalOutput === 2) {
        console.log("✅ Success! Empty string trigger default of +1 worked.");
      } else {
        console.error(`❌ Failure! Expected 2, got ${log.totalOutput}`);
      }

      // Test C: Send standard numeric value "5.0"
      console.log("\n=== TEST C: Publishing numeric payload '5.0' to counter topic ===");
      client.publish(counterTopic, "5.0", { qos: 1 });
      await delay(2000);
      
      log = await prisma.okpLog.findUnique({ where: { id: okpId } });
      console.log(`Output count after '5.0': ${log.totalOutput}`);
      if (log.totalOutput === 7) {
        console.log("✅ Success! Numeric trigger of +5 worked.");
      } else {
        console.error(`❌ Failure! Expected 7, got ${log.totalOutput}`);
      }

      // Test D: Stop the machine and verify float downtime
      console.log("\n=== TEST D: Publishing STOP (0) status to status topic ===");
      client.publish(statusTopic, "0", { qos: 1 });
      await delay(2000);

      // Verify a new open activity log (category breakdown/downtime) is created
      let activeStopLog = await prisma.activityLog.findFirst({
        where: { okpLogId: okpId, endTime: null },
        include: { activityCode: { include: { category: true } } }
      });
      console.log(`Current active state category: ${activeStopLog.activityCode.category.code}`);
      if (activeStopLog.activityCode.category.code !== "PR") {
        console.log("✅ Success! Machine transitioned to STOP state (downtime active).");
      } else {
        console.error("❌ Failure! Machine did not transition to STOP state.");
      }

      // Wait 6 seconds (around 0.1 minutes) to record actual downtime
      console.log("Waiting 6 seconds to accumulate downtime...");
      await delay(6000);

      // Transition machine back to RUN (1)
      console.log("\n=== TEST E: Publishing RUN (1) status to status topic to close downtime ===");
      client.publish(statusTopic, "1", { qos: 1 });
      await delay(2000);

      // Verify the closed activity log duration
      const closedStoppageLog = await prisma.activityLog.findFirst({
        where: {
          okpLogId: okpId,
          activityCode: {
            category: { code: { not: "PR" } }
          }
        },
        orderBy: { id: "desc" }
      });

      if (closedStoppageLog) {
        console.log(`Closed downtime duration: ${closedStoppageLog.duration} minutes`);
        console.log(`Start time: ${closedStoppageLog.startTime}`);
        console.log(`End time: ${closedStoppageLog.endTime}`);
        
        if (closedStoppageLog.duration > 0 && closedStoppageLog.duration < 0.5) {
          console.log("✅ Success! Downtime was recorded with decimal float precision.");
        } else {
          console.error("❌ Failure! Downtime duration is incorrect (should be a small float, e.g., 0.10).");
        }
      } else {
        console.error("❌ Failure! No closed stoppage log found.");
      }

      // Clean up and disconnect
      console.log("\nClosing MQTT client...");
      client.end();
      await prisma.$disconnect();
      console.log("Verification test complete!");
      process.exit(0);

    } catch (err) {
      console.error("Error during verification tests:", err);
      client.end();
      await prisma.$disconnect();
      process.exit(1);
    }
  });

  client.on("error", async (err) => {
    console.error("MQTT client connection error:", err);
    await prisma.$disconnect();
    process.exit(1);
  });
}

verifyAll();
