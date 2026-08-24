const { broadcastEvent } = require("./realtime");
const { 
  getMachineState, 
  setMachineState, 
  getAllHeartbeats 
} = require("./telemetryCache");
const { db } = require("./db");

// Timeout threshold: 45 seconds without telemetry signal -> marked as OFFLINE
const WATCHDOG_TIMEOUT_MS = 45000;
const CHECK_INTERVAL_MS = 5000;

let watchdogTimer = null;

let cachedMqttConfigs = null;
let lastConfigFetch = 0;

function startTelemetryWatchdog() {
  if (watchdogTimer) return;

  // console.log("[Watchdog] Initializing Real-time Telemetry Watchdog Timer (Check interval: 5s, Timeout: 45s)...");

  watchdogTimer = setInterval(async () => {
    try {
      const now = Date.now();
      const heartbeats = getAllHeartbeats();
      if (Object.keys(heartbeats).length === 0) return;

      // Fetch line process IDs for active machines to broadcast properly (cached for 60 seconds)
      if (!cachedMqttConfigs || (now - lastConfigFetch > 60000)) {
        try {
          cachedMqttConfigs = await db.mqttConfig.findMany({
            include: { machine: true }
          });
          lastConfigFetch = now;
        } catch (dbErr) {
          // If DB is offline, continue with cached configs or skip DB lookup gracefully
          if (!cachedMqttConfigs) {
            if (dbErr.message && dbErr.message.includes("Can't reach database server")) {
              // Log subtle warning once per minute when DB is unreachable
              if (now - lastConfigFetch > 30000) {
                console.warn("[Watchdog] Database server unreachable at 127.0.0.1:5432. Waiting for DB...");
                lastConfigFetch = now;
              }
            } else {
              console.error("[Watchdog] Error fetching MQTT configs:", dbErr.message);
            }
            return;
          }
        }
      }

      const mqttConfigs = cachedMqttConfigs || [];
      const configMap = {};
      mqttConfigs.forEach(cfg => {
        configMap[String(cfg.machineId)] = cfg;
      });

      for (const [mIdStr, lastHeartbeat] of Object.entries(heartbeats)) {
        const machineId = parseInt(mIdStr, 10);
        const currentState = getMachineState(machineId);
        
        const idleTime = now - lastHeartbeat;

        // If machine is marked RUN or STOP but no pulse/telemetry arrived for > 45 seconds, mark OFFLINE
        if (idleTime > WATCHDOG_TIMEOUT_MS && currentState !== "OFFLINE") {
          const cfg = configMap[mIdStr];
          const machineName = cfg?.machine?.name || `Machine #${machineId}`;
          const lineProcessId = cfg?.machine?.lineProcessId || null;

          // Update cache state
          setMachineState(machineId, "OFFLINE", {
            lastReason: "Watchdog Connection Timeout"
          });

          // Broadcast state change to SSE clients
          broadcastEvent("machine_state_change", {
            machineId: machineId,
            machineName: machineName,
            state: "OFFLINE",
            reason: "Telemetry Heartbeat Timeout (>45s)",
            timestamp: new Date().toISOString()
          }, lineProcessId);
        }
      }
    } catch (err) {
      if (err.message && err.message.includes("Can't reach database server")) {
        console.warn("[Watchdog] Database unreachable at 127.0.0.1:5432.");
      } else {
        console.error("[Watchdog] Error during heartbeat scan:", err.message);
      }
    }
  }, CHECK_INTERVAL_MS);
}

function stopTelemetryWatchdog() {
  if (watchdogTimer) {
    clearInterval(watchdogTimer);
    watchdogTimer = null;
  }
}

module.exports = {
  startTelemetryWatchdog,
  stopTelemetryWatchdog,
  WATCHDOG_TIMEOUT_MS
};
