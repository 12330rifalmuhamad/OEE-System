import mqtt from "mqtt";
import { db } from "./db";

// Global cache to persist active MQTT client connections across Hot Module Replacement (HMR) reloads
const globalForMqtt = globalThis as unknown as {
  mqttClients: Record<number, mqtt.MqttClient> | undefined;
};

if (!globalForMqtt.mqttClients) {
  globalForMqtt.mqttClients = {};
}

const activeClients = globalForMqtt.mqttClients;

// JSON Path dynamic extractor helper
function getValueFromJson(jsonStr: string, path: string): any {
  try {
    const data = JSON.parse(jsonStr);
    if (!path || path === "$") return data;
    
    const cleanPath = path.replace(/^\$\./, "");
    return data[cleanPath];
  } catch (err) {
    return jsonStr; // Fallback to raw payload string if JSON parsing fails
  }
}

export async function initMqttListeners() {
  try {
    console.log("[MQTT] Initializing MQTT Telemetry Acquisition listeners...");

    const configs = await db.mqttConfig.findMany({
      include: { machine: true },
    });

    // 1. Terminate clients for machine configurations that no longer exist or changed broker
    for (const machineIdStr of Object.keys(activeClients)) {
      const machineId = parseInt(machineIdStr, 10);
      const stillExists = configs.some((c) => c.machineId === machineId);
      if (!stillExists) {
        console.log(`[MQTT] Disconnecting inactive MQTT client for machine ID: ${machineId}`);
        activeClients[machineId].end();
        delete activeClients[machineId];
      }
    }

    // 2. Setup connection for each config
    for (const config of configs) {
      const machineId = config.machineId;
      const brokerUrl = config.brokerUrl;

      // If already connected, reuse the active connection
      if (activeClients[machineId]) {
        continue;
      }

      console.log(`[MQTT] Connecting Machine [${config.machine.name}] to Broker: ${brokerUrl}`);

      const client = mqtt.connect(brokerUrl, {
        clientId: config.clientId || `kmi_oee_listener_${machineId}_${Math.random().toString(16).slice(2, 6)}`,
        username: config.username || undefined,
        password: config.password || undefined,
        reconnectPeriod: 5000,
      });

      client.on("connect", () => {
        console.log(`[MQTT] Successfully connected to broker ${brokerUrl} for Machine [${config.machine.name}]`);
        
        const topics: string[] = [];
        if (config.counterTopic) topics.push(config.counterTopic);
        if (config.statusTopic) topics.push(config.statusTopic);

        if (topics.length > 0) {
          client.subscribe(topics, (err) => {
            if (err) {
              console.error(`[MQTT] Failed to subscribe to topics for [${config.machine.name}]:`, err);
            } else {
              console.log(`[MQTT] Subscribed to telemetry topics for [${config.machine.name}]:`, topics);
            }
          });
        }
      });

      client.on("message", async (topic, message) => {
        const payloadStr = message.toString();

        try {
          // Find the active OKP log for this machine
          const activeOkp = await db.okpLog.findFirst({
            where: { machineId: config.machineId },
            orderBy: { date: "desc" }, // Fetch the most recent production log
          });

          if (!activeOkp) {
            return; // No active OKP Log for this machine, skip recording
          }

          // Case A: Counter Topic Signal (Photoeye Proximity)
          if (config.counterTopic && topic === config.counterTopic) {
            const rawVal = config.counterJsonPath 
              ? getValueFromJson(payloadStr, config.counterJsonPath)
              : payloadStr;
            
            const qty = parseFloat(rawVal);
            if (!isNaN(qty) && qty > 0) {
              // Increment the OKP log actual output in database
              await db.okpLog.update({
                where: { id: activeOkp.id },
                data: {
                  totalOutput: {
                    increment: qty,
                  },
                },
              });
              console.log(`[MQTT] OKP: ${activeOkp.okpNumber} | Mesin: ${config.machine.name} | Counter +${qty} pcs`);
            }
          }

          // Case B: Status Topic Signal (Downtime / Productive State)
          if (config.statusTopic && topic === config.statusTopic) {
            const rawState = config.statusJsonPath 
              ? getValueFromJson(payloadStr, config.statusJsonPath)
              : payloadStr;
            
            const cleanState = String(rawState).trim();
            const isRun = cleanState === config.statusRunValue;
            const isStop = cleanState === config.statusStopValue;

            if (isStop) {
              // If stopped, let's log a Breakdown (BR) activity if the last activity is not already breakdown
              const lastAct = await db.activityLog.findFirst({
                where: { okpLogId: activeOkp.id },
                orderBy: { id: "desc" },
                include: { activityCode: { include: { category: true } } }
              });

              if (!lastAct || lastAct.activityCode.category.code !== "BR") {
                // Find a default breakdown activity code for this company
                const brCode = await db.activityCode.findFirst({
                  where: {
                    companyId: activeOkp.companyId,
                    category: { code: "BR" }
                  }
                });

                if (brCode) {
                  await db.activityLog.create({
                    data: {
                      okpLogId: activeOkp.id,
                      activityCodeId: brCode.id,
                      duration: 1, // Start breakdown recording
                      startTime: new Date(),
                      brRootCause: "Auto-Detected via Telemetry",
                    }
                  });
                  console.log(`[MQTT] [DOWNTIME] Machine [${config.machine.name}] STOPPED! Created auto breakdown log under OKP: ${activeOkp.okpNumber}`);
                }
              }
            } else if (isRun) {
              console.log(`[MQTT] [PRODUCTIVE] Machine [${config.machine.name}] is RUNNING normally.`);
            }
          }

        } catch (dbErr) {
          console.error("[MQTT] Database updates failed:", dbErr);
        }
      });

      client.on("error", (err) => {
        console.error(`[MQTT] Client connection error for [${config.machine.name}]:`, err);
      });

      // Save client reference
      activeClients[machineId] = client;
    }

  } catch (err) {
    console.error("[MQTT] Initialization critical error:", err);
  }
}
