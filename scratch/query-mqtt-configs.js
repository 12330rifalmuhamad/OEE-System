const { db } = require("../lib/db");

async function main() {
  const configs = await db.mqttConfig.findMany({
    include: { machine: true }
  });
  console.log("MQTT CONFIGS:");
  configs.forEach(c => {
    console.log({
      machineName: c.machine.name,
      machineId: c.machineId,
      statusTopic: c.statusTopic,
      statusRunValue: c.statusRunValue,
      statusJsonPath: c.statusJsonPath,
    });
  });
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
