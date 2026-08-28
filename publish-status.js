const mqtt = require("mqtt");

const brokerUrl = "mqtt://broker.hivemq.com:1883";
const topic = "kmi/lineA4/status";
const statusValue = process.argv[2] || "RUN";

console.log(`Connecting to MQTT broker: ${brokerUrl}...`);
const client = mqtt.connect(brokerUrl);

client.on("connect", () => {
  console.log(`Connected! Publishing '${statusValue}' to topic '${topic}'...`);
  
  client.publish(topic, statusValue, { qos: 1 }, (err) => {
    if (err) {
      console.error("Publish failed:", err);
    } else {
      console.log("Publish successful!");
    }
    client.end();
  });
});

client.on("error", (err) => {
  console.error("MQTT Error:", err);
  process.exit(1);
});
