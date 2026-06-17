require("dotenv").config();
const mqtt = require("mqtt");
const { PrismaClient } = require("@prisma/client");
const readline = require("readline");

const prisma = new PrismaClient();
const brokerUrl = "mqtt://broker.hivemq.com:1883";

// Downtime codes list matching KMI database seeding
const DOWNTIME_CODES = [
  { code: "br.1", name: "Chain Conveyor Jammed", category: "BR" },
  { code: "br.2", name: "Sensor Photoeye Fault", category: "BR" },
  { code: "br.3", name: "Air Pressure Drop", category: "BR" },
  { code: "br.4", name: "Label Jammed", category: "BR" },
  { code: "se.1", name: "Weight Dosing Calibration", category: "SE" },
  { code: "se.2", name: "Seaming Chuck Replacement", category: "SE" },
  { code: "sh.1", name: "Weekly Cleaning", category: "SH" },
  { code: "ot.1", name: "Waiting for Bulk Powder", category: "OT" }
];

let client = null;
let machines = [];
let autoAnomalies = false;
let simulationInterval = null;
let anomalyInterval = null;

// ANSI Terminal Colors
const C = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
  bgBlack: "\x1b[40m",
  bold: "\x1b[1m",
  brightGreen: "\x1b[92m",
  brightRed: "\x1b[91m",
  brightYellow: "\x1b[93m"
};

async function main() {
  console.clear();
  console.log(`${C.cyan}${C.bold}========================================================================${C.reset}`);
  console.log(`${C.cyan}${C.bold}🚀 INITIALIZING KMI OEE MULTI-MACHINE TELEMETRY SIMULATOR...${C.reset}`);
  console.log(`${C.cyan}${C.bold}========================================================================${C.reset}`);

  try {
    // 1. Fetch MQTT Configurations & machines from Prisma database
    const configs = await prisma.mqttConfig.findMany({
      include: { machine: true }
    });

    if (configs.length === 0) {
      console.error(`${C.red}[ERROR] Tidak ada konfigurasi MQTT ditemukan di database.${C.reset}`);
      console.log(`Silakan jalankan 'npm run reset-oee' atau seeder terlebih dahulu.`);
      process.exit(1);
    }

    // 2. Fetch latest OKP logs for each machine or its line process
    for (const config of configs) {
      const activeOkp = await prisma.okpLog.findFirst({
        where: config.machine.lineProcessId
          ? {
              companyId: config.companyId,
              machine: { lineProcessId: config.machine.lineProcessId }
            }
          : { machineId: config.machineId },
        orderBy: { date: "desc" }
      });

      // Fetch the last activity log status to check if it's currently running or stopped
      const lastActivity = await prisma.activityLog.findFirst({
        where: { okpLogId: activeOkp ? activeOkp.id : -1 },
        orderBy: { id: "desc" },
        include: { activityCode: { include: { category: true } } }
      });

      const isRunning = lastActivity && lastActivity.activityCode.category.code === "PR";
      const currentCode = lastActivity && !isRunning ? lastActivity.activityCode.code : null;

      machines.push({
        id: config.machineId,
        name: config.machine.name,
        clientId: config.clientId || `kmi_oee_sim_${config.machineId}`,
        counterTopic: config.counterTopic,
        statusTopic: config.statusTopic,
        statusRunValue: config.statusRunValue || "1",
        statusStopValue: config.statusStopValue || "0",
        okpNumber: activeOkp ? activeOkp.okpNumber : "N/A",
        running: isRunning,
        totalPulses: 0,
        currentStoppageCode: currentCode,
        currentStoppageName: currentCode ? (DOWNTIME_CODES.find(dc => dc.code === currentCode.toLowerCase())?.name || "Unknown") : ""
      });
    }

    // 3. Connect to MQTT Broker
    console.log(`Connecting to MQTT broker at: ${C.yellow}${brokerUrl}${C.reset}...`);
    client = mqtt.connect(brokerUrl);

    client.on("connect", () => {
      console.log(`${C.green}✅ Connected successfully to MQTT Broker!${C.reset}`);
      console.log(`Initializing terminal inputs. Interactive simulation is ready.`);
      setupKeyboard();
      startTelemetryLoop();
      renderDashboard();
    });

    client.on("error", (err) => {
      console.error(`${C.red}❌ MQTT Connection error:${C.reset}`, err.message);
      process.exit(1);
    });

  } catch (err) {
    console.error(`${C.red}❌ Critical error during simulator startup:${C.reset}`, err);
    process.exit(1);
  }
}

function setupKeyboard() {
  readline.emitKeypressEvents(process.stdin);
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }

  process.stdin.on("keypress", (str, key) => {
    // Close / Exit
    if (key.ctrl && key.name === "c" || str === "q" || str === "Q") {
      cleanupAndExit();
    }

    // Manual Toggles for Machines 1 to 5
    if (str >= "1" && str <= "5") {
      const idx = parseInt(str, 10) - 1;
      if (machines[idx]) {
        toggleMachineState(idx);
      }
    }

    // Manual Counter Pulses
    if (str === "c" || str === "C") {
      injectManualPulses(10);
    }

    // Recover all machines
    if (str === "r" || str === "R") {
      recoverAllMachines();
    }

    // Random Breakdown trigger
    if (str === "b" || str === "B") {
      triggerRandomBreakdown();
    }

    // Toggle Automated Anomalies mode
    if (str === "a" || str === "A") {
      autoAnomalies = !autoAnomalies;
      if (autoAnomalies) {
        startAnomalyInterval();
      } else {
        stopAnomalyInterval();
      }
      renderDashboard();
    }

    // Show Help
    if (str === "h" || str === "H") {
      showHelpMenu();
    }
  });
}

function toggleMachineState(idx) {
  const m = machines[idx];
  m.running = !m.running;
  
  if (m.running) {
    m.currentStoppageCode = null;
    m.currentStoppageName = "";
    // Publish RUN
    client.publish(m.statusTopic, m.statusRunValue, { qos: 1 });
  } else {
    // Pick random stoppage code
    const randomStop = DOWNTIME_CODES[Math.floor(Math.random() * DOWNTIME_CODES.length)];
    m.currentStoppageCode = randomStop.code;
    m.currentStoppageName = randomStop.name;
    // Publish STOP with target activity code
    client.publish(m.statusTopic, m.currentStoppageCode, { qos: 1 });
  }
  renderDashboard();
}

function recoverAllMachines() {
  machines.forEach((m, idx) => {
    if (!m.running) {
      m.running = true;
      m.currentStoppageCode = null;
      m.currentStoppageName = "";
      client.publish(m.statusTopic, m.statusRunValue, { qos: 1 });
    }
  });
  renderDashboard();
}

function triggerRandomBreakdown() {
  const runningMachines = machines.filter(m => m.running);
  if (runningMachines.length === 0) return;
  
  const m = runningMachines[Math.floor(Math.random() * runningMachines.length)];
  const idx = machines.indexOf(m);
  toggleMachineState(idx);
}

function injectManualPulses(qty) {
  const isLineStopped = machines.some(m => !m.running);
  if (isLineStopped) return; // Do not allow counter pulses if any machine is stopped/broken down

  machines.forEach(m => {
    if (m.running) {
      m.totalPulses += qty;
      client.publish(m.counterTopic, String(qty), { qos: 1 });
    }
  });
  renderDashboard("FAST_PULSE");
}

function startTelemetryLoop() {
  // Telemetry loop: pulses counters for active machines every 2.5s
  simulationInterval = setInterval(() => {
    // If any machine on the line is stopped/broken down, the entire line stops process
    const isLineStopped = machines.some(m => !m.running);
    
    machines.forEach(m => {
      if (!isLineStopped && m.running) {
        m.totalPulses += 1;
        client.publish(m.counterTopic, "1", { qos: 0 });
      }
    });
    renderDashboard();
  }, 2500);
}

function startAnomalyInterval() {
  // Toggle random machine status every 20 seconds in auto mode
  anomalyInterval = setInterval(() => {
    const rIdx = Math.floor(Math.random() * machines.length);
    toggleMachineState(rIdx);
  }, 20000);
}

function stopAnomalyInterval() {
  if (anomalyInterval) {
    clearInterval(anomalyInterval);
    anomalyInterval = null;
  }
}

function showHelpMenu() {
  console.log(`\n${C.yellow}${C.bold}=== SIMULATOR OPTIONS ===${C.reset}`);
  console.log(`- ${C.bold}1 to 5${C.reset} : Toggle state (RUN/STOP) of machine 1 to 5`);
  console.log(`- ${C.bold}c / C${C.reset}   : Inject +10 count pulses immediately to all running machines`);
  console.log(`- ${C.bold}r / R${C.reset}   : Recover/resume all machines to running state`);
  console.log(`- ${C.bold}b / B${C.reset}   : Trigger a random downtime/breakdown on one of the running machines`);
  console.log(`- ${C.bold}a / A${C.reset}   : Toggle Auto-simulation of random floor incidents (Currently: ${autoAnomalies ? C.green + "ON" : C.red + "OFF"}${C.reset})`);
  console.log(`- ${C.bold}h / H${C.reset}   : Show this help menu`);
  console.log(`- ${C.bold}q / Q${C.reset}   : Exit simulator`);
  console.log(`${C.yellow}=========================${C.reset}\n`);
}

function pad(str, targetLength, visibleStr) {
  const visible = visibleStr !== undefined ? String(visibleStr) : String(str);
  const paddingNeeded = Math.max(0, targetLength - visible.length);
  return str + " ".repeat(paddingNeeded);
}

function renderDashboard(event = null) {
  console.clear();
  const timeStr = new Date().toLocaleTimeString();

  console.log(`${C.cyan}${C.bold}========================================================================================${C.reset}`);
  console.log(`🏭 ${C.bold}KMI OEE TELEMETRY HUB - PRODUCTION LINE A4 SIMULATOR${C.reset}            [Time: ${C.white}${timeStr}${C.reset}]`);
  console.log(`${C.cyan}========================================================================================${C.reset}`);
  console.log(`MQTT Broker: ${C.yellow}${brokerUrl}${C.reset} | Mode: ${autoAnomalies ? C.green + "AUTO-SIMULATION ON" : C.yellow + "MANUAL"}${C.reset}`);
  
  if (event === "FAST_PULSE") {
    console.log(`${C.brightGreen}${C.bold}⚡ FAST COUNTER PULSE INJECTED (+10 TO ALL RUNNING MACHINES)${C.reset}`);
  } else {
    console.log(`Status: ${C.green}Broadcasting telemetry ticker every 2.5s${C.reset}`);
  }
  console.log(`${C.cyan}----------------------------------------------------------------------------------------${C.reset}`);

  // Table Headers
  console.log(
    `#   ` +
    `Machine Name             `.padEnd(25) +
    `Status            ` +
    `Active OKP      ` +
    `Pulses Sent     ` +
    `Active Stoppage/Downtime Reason`
  );
  console.log(`${C.white}----------------------------------------------------------------------------------------${C.reset}`);

  machines.forEach((m, idx) => {
    const num = idx + 1;
    const statusRaw = m.running ? "● RUNNING" : "■ STOPPED";
    const statusText = m.running 
      ? `${C.brightGreen}${C.bold}● RUNNING${C.reset}`
      : `${C.brightRed}${C.bold}■ STOPPED${C.reset}`;
    
    const countText = `${C.white}${m.totalPulses} pcs${C.reset}`;
    const okpText = `${C.bold}${C.green}${m.okpNumber}${C.reset}`;
    
    let stoppageDetail = "";
    if (!m.running && m.currentStoppageCode) {
      stoppageDetail = `${C.yellow}[${m.currentStoppageCode.toUpperCase()}] ${m.currentStoppageName}${C.reset}`;
    } else {
      stoppageDetail = `${C.blue}Normal Production Run${C.reset}`;
    }

    console.log(
      `${C.bold}${num}${C.reset}   ` +
      `${pad(m.name, 25)}` +
      `${pad(statusText, 18, statusRaw)}` +
      `${pad(okpText, 16, m.okpNumber)}` +
      `${pad(countText, 16, m.totalPulses + " pcs")}` +
      `${stoppageDetail}`
    );
  });

  console.log(`${C.cyan}----------------------------------------------------------------------------------------${C.reset}`);
  console.log(`${C.bold}Controls:${C.reset} [1-5]: Toggle Machine | [c]: Pulse Count (+10) | [r]: Recover All | [b]: Trigger Stop`);
  console.log(`          [a]: Toggle Auto Mode | [h]: Help Menu | [q]: Quit`);
  console.log(`${C.cyan}========================================================================================${C.reset}`);
}

async function cleanupAndExit() {
  console.log(`\nDisconnecting from MQTT and closing databases...`);
  stopAnomalyInterval();
  if (simulationInterval) clearInterval(simulationInterval);
  
  if (client) {
    client.end();
  }
  await prisma.$disconnect();
  console.log(`Goodbye!`);
  process.exit(0);
}

main();
