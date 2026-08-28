const mqtt = require("mqtt");
const brokerUrl = "mqtt://broker.hivemq.com:1883";
const client = mqtt.connect(brokerUrl);

const statusTopic = "kmi/rifdiansyah_oee/lineA4/machine3/status"; // Cartooning Line A4 status topic

client.on("connect", () => {
  console.log("Connected to broker. Simulating Cartooning Line A4 states...");

  // 1. Simulate breakdown (publish "br.2" which is a breakdown code)
  console.log("Publishing STOP ('br.2') to machine 3...");
  client.publish(statusTopic, "br.2", { qos: 1 }, () => {
    
    // 2. Wait 5 seconds, then simulate recovery (publish "1" to transition to RUN)
    setTimeout(() => {
      console.log("Publishing RUN ('1') to machine 3...");
      client.publish(statusTopic, "1", { qos: 1 }, () => {
        
        console.log("Simulation finished. Closing MQTT connection.");
        client.end();
      });
    }, 5000);

  });
});
