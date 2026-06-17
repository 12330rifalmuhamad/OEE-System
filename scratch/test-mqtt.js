const mqtt = require("mqtt");

console.log("Connecting to broker.hivemq.com...");
const client = mqtt.connect("mqtt://broker.hivemq.com:1883", {
  connectTimeout: 5000
});

client.on("connect", () => {
  console.log("✅ Successfully connected to HiveMQ Public MQTT broker!");
  client.end();
  process.exit(0);
});

client.on("error", (err) => {
  console.error("❌ Connection error:", err.message);
  process.exit(1);
});

setTimeout(() => {
  console.error("❌ Connection timed out after 5 seconds.");
  process.exit(1);
}, 5500);
