const mqtt = require("mqtt");

const brokerUrl = "mqtt://broker.hivemq.com:1883";
const topics = [
  "kmi/rifdiansyah_oee/lineA4/machine1/status",
  "kmi/rifdiansyah_oee/lineA4/machine2/status",
  "kmi/rifdiansyah_oee/lineA4/machine3/status",
  "kmi/rifdiansyah_oee/lineA4/machine4/status"
];

console.log(`Connecting to ${brokerUrl}...`);
const client = mqtt.connect(brokerUrl);

client.on("connect", () => {
  console.log("Connected! Subscribing to status topics...");
  client.subscribe(topics, (err) => {
    if (err) console.error("Sub failed:", err);
    else console.log("Subscribed successfully!");
  });
});

client.on("message", (topic, message) => {
  console.log(`[MONITOR] ${topic} -> "${message.toString()}"`);
});

setTimeout(() => {
  console.log("Monitoring finished after 15 seconds.");
  client.end();
  process.exit(0);
}, 15000);
