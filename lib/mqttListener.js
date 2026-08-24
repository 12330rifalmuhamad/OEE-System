const mqtt = require("mqtt");
const { db } = require("./db");
const { broadcastEvent } = require("./realtime");
const { recalculateOkpLogOee } = require("./oeeHelper");
const { recordHeartbeat, setMachineState } = require("./telemetryCache");

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
    // console.log("[MQTT] Initializing MQTT Telemetry Acquisition listeners...");

    const configs = await db.mqttConfig.findMany({
      include: { machine: true },
    });

    // 1. Terminate clients for machine configurations that no longer exist
    for (const machineIdStr of Object.keys(activeClients)) {
      const machineId = parseInt(machineIdStr, 10);
      const stillExists = configs.some((c) => c.machineId === machineId);
      if (!stillExists) {
        try {
          activeClients[machineId].end(true);
        } catch (e) {}
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

      // If client is already connected to broker, keep it active
      if (activeClients[machineId] && activeClients[machineId].connected) {
        continue;
      }

      // If client exists but is not connected (or reconnecting), recreate it cleanly
      if (activeClients[machineId]) {
        try {
          activeClients[machineId].end(true);
        } catch (e) {}
        delete activeClients[machineId];
      }

      // Stagger connections slightly to prevent ETIMEDOUT throttling from public brokers
      await new Promise((resolve) => setTimeout(resolve, 150));

      // console.log(`[MQTT] Connecting Machine [${config.machine.name}] to Broker: ${brokerUrl}`);

      const client = mqtt.connect(brokerUrl, {
        clientId: config.clientId 
          ? `${config.clientId}_${Math.random().toString(16).slice(2, 6)}`
          : `kmi_oee_listener_${machineId}_${Math.random().toString(16).slice(2, 6)}`,
        username: config.username || undefined,
        password: config.password || undefined,
        connectTimeout: 30000,
        reconnectPeriod: 3000,
        keepalive: 60,
      });

      client.on("connect", () => {
        // console.log(`[MQTT] Successfully connected to broker ${brokerUrl} for Machine [${config.machine.name}]`);
        
        const topics = [];
        if (config.counterTopic) topics.push(config.counterTopic);
        if (config.statusTopic) topics.push(config.statusTopic);

        if (topics.length > 0) {
          client.subscribe(topics, (err) => {
            if (err) {
              console.error(`[MQTT] Failed to subscribe to topics for [${config.machine.name}]:`, err);
            } else {
              // console.log(`[MQTT] Subscribed to telemetry topics for [${config.machine.name}]:`, topics);
            }
          });
        }
      });

      client.on("message", async (topic, message) => {
        const payloadStr = message.toString();
        recordHeartbeat(config.machineId);

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
                qty: qty,
                timestamp: new Date().toISOString()
              }, config.machine.lineProcessId);

              // console.log(`[MQTT] OKP: ${activeOkp.okpNumber} | Mesin: ${config.machine.name} | Counter +${qty} pcs (Primary Counter) | Total: ${recalculated.totalOutput} pcs`);
            } else {
              // Processed but skipped from actual count to avoid double-counting products on the same line
              // console.log(`[MQTT] OKP: ${activeOkp.okpNumber} | Mesin: ${config.machine.name} | Counter pulse skipped to avoid double-counting on Line`);
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
                const isRun = cleanState === config.statusRunValue || cleanState === "1" || cleanState.toUpperCase() === "RUN" || cleanState.toLowerCase() === "true";

                 // Update machine state in cache
                const previousState = machineStates[config.machineId] || "RUN";
                const newState = isRun ? "RUN" : cleanState;
                machineStates[config.machineId] = newState;
                setMachineState(config.machineId, newState);
                const machineStateChanged = previousState !== machineStates[config.machineId];
 
                // Determine the line's overall state:
                // For lines with multiple filling machines, line is RUN if at least 1 filling machine is RUNNING and no non-filling machine is STOPPED.
                let overallState = "RUN";
                let activeDowntimeCode = null;
                let activeMachineId = config.machineId;
                let activeMachineName = config.machine.name;
                let fillingConfigs = [];
                let allFillingStopped = false;
 
                if (config.machine.lineProcessId) {
                  const lineConfigs = configs.filter(c => c.machine.lineProcessId === config.machine.lineProcessId);
                  
                  fillingConfigs = lineConfigs.filter(c => {
                    const mName = c.machine.name.toLowerCase();
                    return mName.includes("filling") || mName.includes("filler");
                  });
                  const nonFillingConfigs = lineConfigs.filter(c => {
                    const mName = c.machine.name.toLowerCase();
                    return !mName.includes("filling") && !mName.includes("filler");
                  });

                  const stoppedNonFilling = nonFillingConfigs.filter(c => {
                    const st = machineStates[c.machineId] || getMachineState(c.machineId);
                    return st !== "RUN";
                  });
                  const runningFilling = fillingConfigs.filter(c => {
                    const st = machineStates[c.machineId] || getMachineState(c.machineId);
                    return st === "RUN";
                  });
                  allFillingStopped = fillingConfigs.length > 0 && runningFilling.length === 0;

                  if (stoppedNonFilling.length > 0) {
                    overallState = "STOP";
                    const currentMachineStopped = stoppedNonFilling.find(c => c.machineId === config.machineId);
                    if (currentMachineStopped && !isRun) {
                      activeDowntimeCode = machineStates[config.machineId];
                      activeMachineId = config.machineId;
                      activeMachineName = config.machine.name;
                    } else {
                      const repConfig = stoppedNonFilling[0];
                      activeDowntimeCode = machineStates[repConfig.machineId];
                      activeMachineId = repConfig.machineId;
                      activeMachineName = repConfig.machine.name;
                    }
                  } else if (allFillingStopped) {
                    overallState = "STOP";
                    const currentMachineStopped = stoppedFilling.find(c => c.machineId === config.machineId);
                    if (currentMachineStopped && !isRun) {
                      activeDowntimeCode = machineStates[config.machineId];
                      activeMachineId = config.machineId;
                      activeMachineName = config.machine.name;
                    } else {
                      const repConfig = stoppedFilling[0];
                      activeDowntimeCode = machineStates[repConfig.machineId];
                      activeMachineId = repConfig.machineId;
                    }
                  } else {
                    overallState = "RUN";
                  }

                  var lineMachinesState = lineConfigs.map(c => ({
                    id: c.machineId,
                    name: c.machine.name,
                    state: machineStates[c.machineId] || "RUN"
                  }));
                } else {
                  // Standalone machine state transition
                  if (!isRun) {
                    overallState = "STOP";
                    activeDowntimeCode = cleanState;
                    activeMachineId = config.machineId;
                    activeMachineName = config.machine.name;
                  }
                  var lineMachinesState = [{
                    id: config.machineId,
                    name: config.machine.name,
                    state: machineStates[config.machineId] || "RUN"
                  }];
                }

                // ALWAYS broadcast machine state change if state changed or if machine transitioned to RUN
                if (machineStateChanged || isRun) {
                  broadcastEvent("machine_state_change", {
                    machineId: config.machineId,
                    machineName: config.machine.name,
                    okpNumber: activeOkp ? activeOkp.okpNumber : null,
                    state: isRun ? "RUN" : "STOP",
                    rawState: cleanState,
                    timestamp: new Date().toISOString(),
                    machines: lineMachinesState
                  }, config.machine.lineProcessId);
                }

                // Fetch all open activity logs (endTime is null) for any OKP on this production line
                const lineOpenLogs = await db.activityLog.findMany({
                  where: {
                    okpLog: {
                      machine: { lineProcessId: config.machine.lineProcessId }
                    },
                    endTime: null,
                  },
                  orderBy: { id: "desc" },
                  include: {
                    activityCode: {
                      include: { category: true },
                    },
                    okpLog: true,
                  },
                });

                const lastOpenLog = lineOpenLogs[0];

                if (overallState === "RUN") {
                  // --- LINE IS OVERALL RUNNING ---
                  // 0. Close any open Full Line Downtime log since line is overall RUNNING now
                  const openFullLineStopLogs = lineOpenLogs.filter(l => 
                    l.activityCode.category.code !== "PR" && 
                    l.brRootCause && 
                    l.brRootCause.includes("Full Line Downtime")
                  );
                  if (openFullLineStopLogs.length > 0) {
                    const now = new Date();
                    for (const fullStopLog of openFullLineStopLogs) {
                      const start = fullStopLog.startTime || fullStopLog.createdAt || now;
                      let durationMin = parseFloat(((now - start) / 60000).toFixed(2));
                      if (isNaN(durationMin) || durationMin <= 0) durationMin = 0.01;
                      await db.activityLog.update({
                        where: { id: fullStopLog.id },
                        data: { endTime: now, duration: durationMin }
                      });
                    }
                  }

                  // 1. Maintain main line PR running log
                  const existingOpenPr = await db.activityLog.findFirst({
                    where: {
                      okpLogId: activeOkp.id,
                      endTime: null,
                      activityCode: { category: { code: "PR" } }
                    }
                  });

                  let runCode = await db.activityCode.findFirst({
                    where: { companyId: activeOkp.companyId, code: "PR.1" }
                  }) || await db.activityCode.findFirst({
                    where: { companyId: activeOkp.companyId, category: { code: "PR" } }
                  });

                  if (!existingOpenPr && runCode) {
                    await db.activityLog.create({
                      data: {
                        okpLogId: activeOkp.id,
                        activityCodeId: runCode.id,
                        startTime: new Date(),
                        endTime: null,
                        duration: 0,
                      },
                    });
                  }

                  // 2. Individual Machine Downtime Tracking (Background machine-level activity logs)
                  if (!isRun) {
                    let targetCode = await db.activityCode.findFirst({
                      where: {
                        companyId: activeOkp.companyId,
                        code: { equals: cleanState, mode: "insensitive" },
                      },
                      include: { category: true },
                    }) || await db.activityCode.findFirst({
                      where: {
                        companyId: activeOkp.companyId,
                        code: "unknown",
                      },
                      include: { category: true },
                    }) || await db.activityCode.findFirst({
                      where: {
                        companyId: activeOkp.companyId,
                        category: { code: "BR" },
                      },
                      include: { category: true },
                    });

                    // Check existing open logs for this specific machine
                    const openMachineLogs = await db.activityLog.findMany({
                      where: {
                        okpLogId: activeOkp.id,
                        endTime: null,
                        activityCode: { category: { code: { not: "PR" } } },
                        OR: [
                          { brRootCause: { contains: config.machine.name, mode: "insensitive" } },
                          { brRootCause: null }
                        ]
                      }
                    });

                    let shouldCreateNew = true;
                    if (openMachineLogs.length > 0) {
                      const now = new Date();
                      for (const openLog of openMachineLogs) {
                        if (targetCode && openLog.activityCodeId === targetCode.id) {
                          // Code is identical, keep existing open log!
                          shouldCreateNew = false;
                        } else {
                          // Code or state changed: close previous open log for this machine!
                          const start = openLog.startTime || openLog.createdAt || now;
                          let durationMin = parseFloat(((now - start) / 60000).toFixed(2));
                          if (isNaN(durationMin) || durationMin <= 0) durationMin = 0.01;
                          await db.activityLog.update({
                            where: { id: openLog.id },
                            data: { endTime: now, duration: durationMin },
                          });
                        }
                      }
                    }

                    if (shouldCreateNew && targetCode) {
                      const newLog = await db.activityLog.create({
                        data: {
                          okpLogId: activeOkp.id,
                          activityCodeId: targetCode.id,
                          startTime: new Date(),
                          endTime: null,
                          duration: 0,
                          brRootCause: `[${config.machine.name}] Partial Downtime (Single Machine Stopped)`,
                        },
                      });

                      broadcastEvent("machine_state_change", {
                        activityLogId: newLog.id,
                        machineId: config.machineId,
                        machineName: config.machine.name,
                        okpNumber: activeOkp.okpNumber,
                        state: "STOP",
                        activityCode: targetCode.code,
                        category: targetCode.category.code,
                        description: targetCode.fullDescription,
                        startTime: newLog.startTime.toISOString(),
                      }, config.machine.lineProcessId);
                    }
                  } else {
                    // Machine is RUNNING - close any open background stoppage log for this specific machine
                    const openMachineLogs = await db.activityLog.findMany({
                      where: {
                        okpLogId: activeOkp.id,
                        endTime: null,
                        activityCode: { category: { code: { not: "PR" } } },
                        OR: [
                          { brRootCause: { contains: config.machine.name, mode: "insensitive" } },
                          { brRootCause: null }
                        ]
                      }
                    });

                    if (openMachineLogs.length > 0) {
                      const now = new Date();
                      for (const openLog of openMachineLogs) {
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
                      }
                    }

                    if (machineStateChanged || isRun) {
                      broadcastEvent("machine_state_change", {
                        machineId: config.machineId,
                        machineName: config.machine.name,
                        okpNumber: activeOkp.okpNumber,
                        state: isRun ? "RUN" : cleanState,
                        timestamp: new Date().toISOString(),
                        machines: lineMachinesState
                      }, config.machine.lineProcessId);
                    }
                  }

                  await recalculateOkpLogOee(activeOkp.id, db);
                } else {
                  // --- TRANSITION TO FULL LINE STOP ---
                  // Try to find a matching ActivityCode by code (e.g., "br.1", "sh.1")
                  let targetCode = await db.activityCode.findFirst({
                    where: {
                      companyId: activeOkp.companyId,
                      code: { equals: activeDowntimeCode, mode: "insensitive" },
                    },
                    include: { category: true },
                  });

                  if (!targetCode) {
                    targetCode = await db.activityCode.findFirst({
                      where: {
                        companyId: activeOkp.companyId,
                        code: "unknown",
                      },
                      include: { category: true },
                    }) || await db.activityCode.findFirst({
                      where: {
                        companyId: activeOkp.companyId,
                        category: { code: "BR" },
                      },
                      include: { category: true },
                    });
                  }

                  if (targetCode) {
                    // Check if a Full Line Downtime log is ALREADY open
                    const existingFullStopLog = lineOpenLogs.find(l => 
                      l.activityCode.category.code !== "PR" && 
                      l.brRootCause && 
                      l.brRootCause.includes("Full Line Downtime")
                    );

                    if (existingFullStopLog) {
                      // Full Line Downtime log is already open and active! Close any orphan single-machine or PR logs.
                      const orphanLogs = lineOpenLogs.filter(l => l.id !== existingFullStopLog.id);
                      const now = new Date();
                      for (const orphan of orphanLogs) {
                        const start = orphan.startTime || orphan.createdAt || now;
                        let durationMin = parseFloat(((now - start) / 60000).toFixed(2));
                        if (isNaN(durationMin) || durationMin <= 0) durationMin = 0.01;
                        await db.activityLog.update({
                          where: { id: orphan.id },
                          data: { endTime: now, duration: durationMin },
                        });
                      }
                      return;
                    }

                    // Close ALL previous open logs on the line (including PR and partial single-machine logs)
                    if (lineOpenLogs.length > 0) {
                      const now = new Date();
                      for (const openLog of lineOpenLogs) {
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
                      }
                    }

                    // Create new single consolidated full line stoppage activity log
                    const downtimeLabel = allFillingStopped 
                      ? "[Semua Mesin Filling] Full Line Downtime" 
                      : (activeMachineName ? `[${activeMachineName}] Full Line Downtime` : "Full Line Downtime");

                    const newLog = await db.activityLog.create({
                      data: {
                        okpLogId: activeOkp.id,
                        activityCodeId: targetCode.id,
                        startTime: new Date(),
                        endTime: null,
                        duration: 0,
                        brRootCause: downtimeLabel,
                      },
                    });

                    await recalculateOkpLogOee(activeOkp.id, db);

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
                  }
                }
              } catch (innerErr) {
                console.error("[MQTT] Queue execution error:", innerErr);
              }
            });
            await statusProcessingQueue;
          }

        } catch (dbErr) {
          if (dbErr.code === 'P1001' || (dbErr.message && dbErr.message.includes("Can't reach database server"))) {
            // Suppress verbose stack trace when database service is offline/restarting
          } else {
            console.error("[MQTT] Database updates failed:", dbErr.message || dbErr);
          }
        }
      });

      let lastLoggedErrorTime = 0;

      client.on("error", (err) => {
        const now = Date.now();
        // Log connection error at most once per 60 seconds per machine to prevent terminal log spam when offline
        if (now - lastLoggedErrorTime > 60000) {
          lastLoggedErrorTime = now;
          const errMsg = err.code ? `${err.code} - ${err.message}` : err.message;
          console.warn(`[MQTT] Connection offline for Machine [${config.machine.name}] (${brokerUrl}): ${errMsg}`);
        }
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
