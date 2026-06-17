const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

client.on("connect", () => {
  console.log("Connected to HiveMQ broker.");
  const statusTopic = "kmi/rifdiansyah_oee/lineA4/machine1/status";
  console.log(`Publishing STOP (0) to ${statusTopic}...`);
  client.publish(statusTopic, "0", { qos: 0 }, (err) => {
    if (err) console.error("Publish error:", err);
    else console.log("Published STOP status successfully.");
    
    setTimeout(() => {
      client.end();
      process.exit(0);
    }, 2000);
  });
});
