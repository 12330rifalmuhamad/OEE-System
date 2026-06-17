const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

client.on("connect", () => {
  console.log("Connected to HiveMQ broker.");
  const topics = [
    "kmi/rifdiansyah_oee/lineA4/+/status",
    "kmi/rifdiansyah_oee/lineA4/+/counter"
  ];
  client.subscribe(topics, () => {
    console.log("Subscribed to all lineA4 machine telemetry topics.");
  });
});

client.on("message", (topic, message) => {
  console.log(`[REC] Topic: ${topic} | Msg: ${message.toString()}`);
});
