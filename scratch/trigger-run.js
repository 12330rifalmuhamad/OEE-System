const mqtt = require("mqtt");
const brokerUrl = "mqtt://broker.hivemq.com:1883";
const statusTopic = "kmi/rifdiansyah_oee/lineA4/machine1/status";

console.log(`Connecting to MQTT broker at: ${brokerUrl}`);
const client = mqtt.connect(brokerUrl, {
  clientId: `kmi_trigger_run_${Math.random().toString(16).slice(2, 8)}`,
  connectTimeout: 5000,
});

client.on("connect", () => {
  console.log(`Connected! Publishing '1' (RUN) to topic: ${statusTopic}`);
  
  client.publish(statusTopic, "1", { qos: 1 }, (err) => {
    if (err) {
      console.error("Failed to publish:", err);
    } else {
      console.log("Successfully published RUN status '1'!");
    }
    client.end();
  });
});

client.on("error", (err) => {
  console.error("MQTT client error:", err);
  client.end();
});
