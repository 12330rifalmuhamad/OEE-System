const mqtt = require("mqtt");

const client = mqtt.connect("mqtt://broker.hivemq.com:1883");

client.on("connect", () => {
  console.log("Connected to HiveMQ public broker.");
  
  const statusTopic = "kmi/rifdiansyah_oee/lineA4/machine1/status";
  console.log(`Publishing RUN (1) to ${statusTopic}...`);
  
  client.publish(statusTopic, "1", { qos: 0 }, (err) => {
    if (err) console.error("Publish error:", err);
    else console.log("Published status successfully.");
    
    const counterTopic = "kmi/rifdiansyah_oee/lineA4/machine1/counter";
    console.log(`Publishing counter (1) to ${counterTopic}...`);
    
    client.publish(counterTopic, "1", { qos: 0 }, (err) => {
      if (err) console.error("Publish error:", err);
      else console.log("Published counter successfully.");
      
      console.log("Waiting 2 seconds before disconnecting...");
      setTimeout(() => {
        client.end();
        console.log("Disconnected.");
        process.exit(0);
      }, 2000);
    });
  });
});
