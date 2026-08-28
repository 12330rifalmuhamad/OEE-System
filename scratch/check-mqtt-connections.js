const { initMqttListeners, activeClients } = require("../lib/mqttListener");

async function check() {
  console.log("Initializing MQTT listeners...");
  await initMqttListeners();
  
  console.log("Waiting 10 seconds for connections to establish...");
  await new Promise(r => setTimeout(r, 10000));

  console.log("\nChecking active clients connected state:");
  for (const machineId of Object.keys(activeClients)) {
    const client = activeClients[machineId];
    console.log(`Machine ID: ${machineId} | Connected: ${client ? client.connected : "false"}`);
  }
  
  // Close clients
  console.log("\nClosing all clients...");
  for (const machineId of Object.keys(activeClients)) {
    activeClients[machineId].end();
  }
  process.exit(0);
}

check().catch(err => {
  console.error("Error:", err);
  process.exit(1);
});
