const mqtt = require("mqtt");
const { db } = require("./db");
const { broadcastEvent } = require("./realtime");
const { recalculateOkpLogOee } = require("./oeeHelper");

// Global cache to persist active MQTT client connections
const activeClients = {};

// Global cache to persist active machine states (e.g., { machineId: "RUN" or "br.1" })
const machineStates = {};

// Global promise chain queue to serialize state change handling and prevent race conditions
let statusProcessingQueue = Promise.resolve();

// JSON Path dynamic extractor helper
function getValueFromJson(jsonStr, path) {
  try {
    const data = JSON.parse(jsonStr);
    if (!path || path === "$") return data;
    
    const cleanPath = path.replace(/^\$\./, "");
    return data[cleanPath];
  } catch (err) {
    return jsonStr; // Fallback to raw payload string if JSON parsing fails
  }
}

async function initMqttListeners() {
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
        delete machineStates[machineId];
      }
    }

    // 2. Setup connection for each config
    for (const config of configs) {
      const machineId = config.machineId;
      const brokerUrl = config.brokerUrl;

      // Initialize state to "RUN" by default if not set
      if (machineStates[machineId] === undefined) {
        machineStates[machineId] = "RUN";
      }

      // If already connected, reuse the active connection
      if (activeClients[machineId]) {
        continue;
      }

      console.log(`[MQTT] Connecting Machine [${config.machine.name}] to Broker: ${brokerUrl}`);

      const client = mqtt.connect(brokerUrl, {
        clientId: config.clientId 
          ? `${config.clientId}_${Math.random().toString(16).slice(2, 6)}`
          : `kmi_oee_listener_${machineId}_${Math.random().toString(16).slice(2, 6)}`,
        username: config.username || undefined,
        password: config.password || undefined,
        reconnectPeriod: 5000,
      });

      client.on("connect", () => {
        console.log(`[MQTT] Successfully connected to broker ${brokerUrl} for Machine [${config.machine.name}]`);
        
        const topics = [];
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
          // Find the active OKP log for this machine or its production line process
          const activeOkp = await db.okpLog.findFirst({
            where: config.machine.lineProcessId
              ? {
                  companyId: config.companyId,
                  machine: {
                    lineProcessId: config.machine.lineProcessId
                  }
                }
              : {
                  machineId: config.machineId
                },
            orderBy: { date: "desc" }, // Fetch the most recent production log
          });

          if (!activeOkp) {
            return; // No active OKP Log for this machine or line, skip recording
          }

          // Case A: Counter Topic Signal (Photoeye Proximity)
          if (config.counterTopic && topic === config.counterTopic) {
            // Only increment totalOutput if this telemetry signal comes from the representative machine of the OKP
            // (e.g. Filling Line A4) to prevent multiple counting of the same product as it moves down the line.
            if (config.machine.name.toLowerCase().includes("filling") || config.machineId === activeOkp.machineId) {
              const rawVal = config.counterJsonPath 
                ? getValueFromJson(payloadStr, config.counterJsonPath)
                : payloadStr;
              
              let qty = parseFloat(rawVal);
              if (isNaN(qty) || qty <= 0) {
                qty = 1.0; // Default trigger pulse count to +1 for non-numeric or empty signals
              }
              
              // Increment the OKP log actual output in database
              const updatedOkp = await db.okpLog.update({
                where: { id: activeOkp.id },
                data: {
                  totalOutput: {
                    increment: qty,
                  },
                },
              });
              const recalculated = await recalculateOkpLogOee(activeOkp.id, db);

              // Broadcast counter_pulse event to all connected SSE clients (Laravel Dashboard)
              broadcastEvent("counter_pulse", {
                okpLogId: activeOkp.id,
                okpNumber: activeOkp.okpNumber,
                totalOutput: recalculated.totalOutput,
                oee: recalculated.oee,
                availability: recalculated.availability,
                performance: recalculated.performance,
                quality: recalculated.quality,
              }, config.machine.lineProcessId);

              console.log(`[MQTT] OKP: ${activeOkp.okpNumber} | Mesin: ${config.machine.name} | Counter +${qty} pcs (Primary Counter) | Total: ${recalculated.totalOutput} pcs`);
            } else {
              // Processed but skipped from actual count to avoid double-counting products on the same line
              console.log(`[MQTT] OKP: ${activeOkp.okpNumber} | Mesin: ${config.machine.name} | Counter pulse skipped to avoid double-counting on Line`);
            }
          }

          // Case B: Status Topic Signal (Downtime / Productive State)
          if (config.statusTopic && topic === config.statusTopic) {
            statusProcessingQueue = statusProcessingQueue.then(async () => {
              try {
                const rawState = config.statusJsonPath 
                  ? getValueFromJson(payloadStr, config.statusJsonPath)
                  : payloadStr;
                
                const cleanState = String(rawState).trim();
                const isRun = cleanState === config.statusRunValue;

                 // Update machine state in cache
                const previousState = machineStates[config.machineId] || "RUN";
                machineStates[config.machineId] = isRun ? "RUN" : cleanState;
                const machineStateChanged = previousState !== machineStates[config.machineId];
 
                // Determine the line's overall state:
                // The line is STOP if any machine in the line is stopped; it is RUN only if all machines are running.
                let overallState = "RUN";
                let activeDowntimeCode = null;
                let activeMachineId = config.machineId;
                let activeMachineName = config.machine.name;
 
                if (config.machine.lineProcessId) {
                  // Find if any machine on this line is currently in a stopped state
                  const lineConfigs = configs.filter(c => c.machine.lineProcessId === config.machine.lineProcessId);
                  const stoppedConfigs = lineConfigs.filter(c => machineStates[c.machineId] && machineStates[c.machineId] !== "RUN");
 
                  if (stoppedConfigs.length > 0) {
                    overallState = "STOP";
                    const currentMachineStopped = stoppedConfigs.find(c => c.machineId === config.machineId);
                    if (currentMachineStopped && !isRun) {
                      activeDowntimeCode = machineStates[config.machineId];
                      activeMachineId = config.machineId;
                      activeMachineName = config.machine.name;
                    } else {
                      const repConfig = stoppedConfigs[0];
                      activeDowntimeCode = machineStates[repConfig.machineId];
                      activeMachineId = repConfig.machineId;
                      activeMachineName = repConfig.machine.name;
                    }
                  }
                } else {
                  // Standalone machine state transition
                  if (!isRun) {
                    overallState = "STOP";
                    activeDowntimeCode = cleanState;
                    activeMachineId = config.machineId;
                    activeMachineName = config.machine.name;
                  }
                }

                // Fetch all open activity logs (endTime is null) for this active OKP
                const openLogs = await db.activityLog.findMany({
                  where: {
                    okpLogId: activeOkp.id,
                    endTime: null,
                  },
                  orderBy: { id: "desc" },
                  include: {
                    activityCode: {
                      include: { category: true },
                    },
                  },
                });

                const lastOpenLog = openLogs[0];

                if (overallState === "RUN") {
                  // --- TRANSITION TO RUN ---
                  // If already running (last open log category is "PR"), do nothing
                  if (lastOpenLog && lastOpenLog.activityCode.category.code === "PR") {
                    return;
                  }

                  console.log(`[MQTT] [PRODUCTIVE] Line/Machine transitioning to RUN.`);

                  // Close all previous open logs if they exist
                  if (openLogs.length > 0) {
                    const now = new Date();
                    for (const openLog of openLogs) {
                      const start = openLog.startTime || openLog.createdAt || now;
                      let durationMin = parseFloat(((now - start) / 60000).toFixed(2));
                      if (isNaN(durationMin) || durationMin <= 0) {
                        durationMin = 0.01;
                      }
                      await db.activityLog.update({
                        where: { id: openLog.id },
                        data: {
                          endTime: now,
                          duration: durationMin,
                        },
                      });
                      console.log(`[MQTT] Closed previous open log [${openLog.activityCode.code}] with duration ${durationMin} mins.`);
                    }
                  }

                  // Find the productive run activity code ("PR" category) for this company
                  const runCode = await db.activityCode.findFirst({
                    where: {
                      companyId: activeOkp.companyId,
                      category: { code: "PR" },
                    },
                  });

                  if (runCode) {
                    await db.activityLog.create({
                      data: {
                        okpLogId: activeOkp.id,
                        activityCodeId: runCode.id,
                        startTime: new Date(),
                        endTime: null,
                        duration: 0,
                      },
                    });

                    await recalculateOkpLogOee(activeOkp.id, db);

                    // Broadcast event to frontend
                    broadcastEvent("machine_state_change", {
                      machineId: config.machineId,
                      machineName: config.machine.name,
                      okpNumber: activeOkp.okpNumber,
                      state: "RUN",
                      timestamp: new Date().toISOString(),
                    }, config.machine.lineProcessId);
                  }
                } else {
                  // --- TRANSITION TO STOP ---
                  // Try to find a matching ActivityCode by code (e.g., "br.1", "sh.1")
                  let targetCode = await db.activityCode.findFirst({
                    where: {
                      companyId: activeOkp.companyId,
                      code: { equals: activeDowntimeCode, mode: "insensitive" },
                    },
                    include: { category: true },
                  });

                  // Fallback to default "unknown" activity code if specific code not found
                  if (!targetCode) {
                    targetCode = await db.activityCode.findFirst({
                      where: {
                        companyId: activeOkp.companyId,
                        code: "unknown",
                      },
                      include: { category: true },
                    });
                    
                    // Ultimate fallback to first BR code if "unknown" is not in DB
                    if (!targetCode) {
                      targetCode = await db.activityCode.findFirst({
                        where: {
                          companyId: activeOkp.companyId,
                          category: { code: "BR" },
                        },
                        include: { category: true },
                      });
                    }
                  }

                  if (targetCode) {
                    // If already stopped with this exact code, do nothing
                    if (lastOpenLog && lastOpenLog.activityCodeId === targetCode.id) {
                      if (machineStateChanged && isRun) {
                        broadcastEvent("machine_state_change", {
                          machineId: config.machineId,
                          machineName: config.machine.name,
                          okpNumber: activeOkp.okpNumber,
                          state: "RUN",
                          timestamp: new Date().toISOString(),
                        }, config.machine.lineProcessId);
                      }
                      return;
                    }
 
                    // Prevent resetting classified downtime back to "unknown" via periodic MQTT telemetry signals
                    if (
                      lastOpenLog &&
                      lastOpenLog.activityCode.category.code !== "PR" &&
                      targetCode.code === "unknown"
                    ) {
                      return;
                    }
 
                    console.log(`[MQTT] [DOWNTIME] Line/Machine transitioning to STOP [${targetCode.code}]. Triggered by: ${activeMachineName}`);
 
                    // Close all previous open logs
                    if (openLogs.length > 0) {
                      const now = new Date();
                      for (const openLog of openLogs) {
                        const start = openLog.startTime || openLog.createdAt || now;
                        let durationMin = parseFloat(((now - start) / 60000).toFixed(2));
                        if (isNaN(durationMin) || durationMin <= 0) {
                          durationMin = 0.01;
                        }
                        await db.activityLog.update({
                          where: { id: openLog.id },
                          data: {
                            endTime: now,
                            duration: durationMin,
                          },
                        });
                        console.log(`[MQTT] Closed previous run/state log [${openLog.activityCode.code}] with duration ${durationMin} mins.`);
                      }
                    }
 
                    // Create new stoppage activity log
                    const newLog = await db.activityLog.create({
                      data: {
                        okpLogId: activeOkp.id,
                        activityCodeId: targetCode.id,
                        startTime: new Date(),
                        endTime: null,
                        duration: 0,
                        brRootCause: "Auto-Detected via Telemetry",
                      },
                    });
 
                    await recalculateOkpLogOee(activeOkp.id, db);
 
                    // Broadcast event to frontend
                    broadcastEvent("machine_state_change", {
                      activityLogId: newLog.id,
                      machineId: activeMachineId,
                      machineName: activeMachineName,
                      okpNumber: activeOkp.okpNumber,
                      state: "STOP",
                      activityCode: targetCode.code,
                      category: targetCode.category.code,
                      description: targetCode.fullDescription,
                      startTime: newLog.startTime.toISOString(),
                    }, config.machine.lineProcessId);
 
                    // If a machine just recovered but overall line is still stopped,
                    // we ALSO broadcast its RUN event so the frontend knows that specific machine is running.
                    if (machineStateChanged && isRun) {
                      broadcastEvent("machine_state_change", {
                        machineId: config.machineId,
                        machineName: config.machine.name,
                        okpNumber: activeOkp.okpNumber,
                        state: "RUN",
                        timestamp: new Date().toISOString(),
                      }, config.machine.lineProcessId);
                    }
                  }
                }
              } catch (innerErr) {
                console.error("[MQTT] Queue execution error:", innerErr);
              }
            });
            await statusProcessingQueue;
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

module.exports = {
  initMqttListeners,
  activeClients,
  machineStates,
};
