/**
 * In-Memory Telemetry State Cache Module
 * Provides atomic, high-speed access to current machine states, last counter pulse,
 * and heartbeat timestamps for ultra-responsive real-time monitoring.
 */

const machineStateCache = {};
const machineHeartbeats = {};
const machineMetadata = {};

function setMachineState(machineId, state, metadata = {}) {
  const mId = String(machineId);
  machineStateCache[mId] = state;
  machineHeartbeats[mId] = Date.now();
  if (metadata && Object.keys(metadata).length > 0) {
    machineMetadata[mId] = {
      ...(machineMetadata[mId] || {}),
      ...metadata,
      lastUpdated: new Date().toISOString()
    };
  }
}

function getMachineState(machineId) {
  const mId = String(machineId);
  return machineStateCache[mId] || "STOP";
}

function getAllMachineStates() {
  return { ...machineStateCache };
}

function recordHeartbeat(machineId) {
  const mId = String(machineId);
  machineHeartbeats[mId] = Date.now();
}

function getLastHeartbeat(machineId) {
  const mId = String(machineId);
  return machineHeartbeats[mId] || null;
}

function getAllHeartbeats() {
  return { ...machineHeartbeats };
}

module.exports = {
  setMachineState,
  getMachineState,
  getAllMachineStates,
  recordHeartbeat,
  getLastHeartbeat,
  getAllHeartbeats,
  machineStateCache,
  machineHeartbeats
};
