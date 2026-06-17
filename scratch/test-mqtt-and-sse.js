const mqtt = require("mqtt");
const { PrismaClient } = require("@prisma/client");
const http = require("http");

const prisma = new PrismaClient();
const statusTopic = "kmi/rifdiansyah_oee/lineA4/machine1/status";
const brokerUrl = "mqtt://broker.hivemq.com:1883";

async function run() {
  console.log("=== SSE & MQTT Ingestion Flow Test ===");

  // 1. Establish SSE Connection
  console.log("Connecting to SSE stream...");
  const sseRequest = http.request("http://localhost:5001/api/transactions/realtime/stream", {
    headers: {
      "Accept": "text/event-stream"
    }
  }, (res) => {
    console.log(`SSE connection status: ${res.statusCode}`);
    res.setEncoding("utf-8");
    res.on("data", (chunk) => {
      console.log("\n[SSE Client Received Raw Chunk]:");
      console.log(chunk);
    });
  });

  sseRequest.on("error", (err) => {
    console.error("SSE Request Error:", err.message);
  });
  sseRequest.end();

  // Give SSE client 2 seconds to establish connection
  await new Promise(r => setTimeout(r, 2000));

  // 2. Connect to MQTT and Publish RUN first, then STOP
  console.log("\nConnecting to MQTT broker to perform transition test...");
  const mqttClient = mqtt.connect(brokerUrl);

  mqttClient.on("connect", async () => {
    console.log("MQTT Client connected.");
    
    // Step A: Publish RUN (1) to clear any existing stop states
    console.log("Step A: Publishing status '1' (RUN)...");
    mqttClient.publish(statusTopic, "1", { qos: 1 });
    
    await new Promise(r => setTimeout(r, 2000));
    
    // Step B: Publish STOP (0) to trigger stoppage transition
    console.log("Step B: Publishing status '0' (STOP)...");
    mqttClient.publish(statusTopic, "0", { qos: 1 });
  });

  mqttClient.on("error", (err) => {
    console.error("MQTT error:", err);
  });

  // Wait 7 seconds to observe SSE outputs
  await new Promise(r => setTimeout(r, 7000));

  console.log("\nClosing connections...");
  mqttClient.end();
  sseRequest.destroy();
  await prisma.$disconnect();
  console.log("Test finished!");
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
