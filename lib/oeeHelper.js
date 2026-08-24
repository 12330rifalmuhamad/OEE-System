const { db } = require("./db");

function getProductSizeInKg(product) {
  if (!product) return 0.8;
  if (product.netFill && product.netFill > 0) {
    return product.netFill / 1000;
  }
  const name = product.name || "";
  const doubleMatch = name.match(/(\d+)\s*[xX]\s*(\d+)\s*(?:gr|g)?/i);
  if (doubleMatch) {
    const qty = parseInt(doubleMatch[1], 10);
    const weight = parseInt(doubleMatch[2], 10);
    return (qty * weight) / 1000;
  }
  const singleMatch = name.match(/(\d+)\s*(?:gr|g|kg)/i);
  if (singleMatch) {
    const val = parseInt(singleMatch[1], 10);
    if (name.toLowerCase().includes("kg")) {
      return val;
    }
    return val / 1000;
  }
  return 0.8;
}

async function recalculateOkpLogOee(okpLogId, prismaTx = null) {
  const client = prismaTx || db;
  
  // 1. Fetch OKP Log along with relations
  const log = await client.okpLog.findUnique({
    where: { id: okpLogId },
    include: {
      product: {
        include: {
          machineSpeeds: true
        }
      },
      activities: {
        include: {
          activityCode: {
            include: {
              category: true,
            },
          },
        },
      },
    },
  });

  if (!log) {
    console.warn(`[OEE Helper] OKP Log with ID ${okpLogId} not found.`);
    return;
  }

  // 1.1 If this is an imported log (totalInput is populated), use weight-based calculations
  if (log.totalInput !== null) {
    const sizeInKg = getProductSizeInKg(log.product);
    const outputTon = (log.totalOutput * sizeInKg) / 1000;
    const inputTon = log.totalInput || 0;

    // Recalculate Yield
    let yieldVal = 100;
    if (inputTon > 0) {
      yieldVal = (outputTon / inputTon) * 100;
    }

    // Recalculate Quality Rate (QR)
    const sieve = log.reworkSieve || 0;
    const filling = log.reworkFilling || 0;
    const ejector = log.reworkEjector || 0;
    const packing = log.reworkPacking || 0;
    const other = log.reworkOther || 0;
    const reject = log.reject || 0;

    const qualityLossKg = sieve + filling + ejector + packing + other + reject;
    const outputKg = outputTon * 1000;
    let qr = 100;
    if (outputKg > 0) {
      qr = ((outputKg - qualityLossKg) / outputKg) * 100;
      if (qr < 0) qr = 0;
    }

    // AR and PR are preserved from what was imported or calculated on creation
    const ar = log.availability || 100;
    const pr = log.performance || 100;
    const oee = (ar / 100) * (pr / 100) * (qr / 100) * 100;

    const updatedLog = await client.okpLog.update({
      where: { id: okpLogId },
      data: {
        yield: parseFloat(yieldVal.toFixed(2)),
        availability: parseFloat(ar.toFixed(2)),
        performance: parseFloat(pr.toFixed(2)),
        quality: parseFloat(qr.toFixed(2)),
        oee: parseFloat(oee.toFixed(2)),
        updatedAt: new Date(),
      },
    });

    return updatedLog;
  }

  // 2. Separate Downtime vs Minor Stoppages (MI) for sensor-based logs
  let logDowntime = 0;
  let logMI = 0;
  let isActive = false;

  log.activities.forEach((act) => {
    const categoryCode = act.activityCode?.category?.code;
    let actDuration = act.duration;
    
    if (act.endTime === null) {
      isActive = true;
      const startTime = act.startTime || act.createdAt || new Date();
      actDuration = parseFloat(((new Date() - new Date(startTime)) / 60000).toFixed(2));
      if (isNaN(actDuration) || actDuration < 0) {
        actDuration = 0;
      }
    }

    if (categoryCode === "MI") {
      logMI += actDuration;
    } else if (categoryCode !== "PR") {
      logDowntime += actDuration;
    }
  });

  // 3. Apply Master Formulas
  // Use dynamic elapsed time as loadingTime if the OKP is still active, capped at the planned loadingTime.
  let currentLoadingTime = log.loadingTime;
  if (isActive) {
    const startTime = log.date || log.createdAt;
    const elapsedMinutes = (new Date() - new Date(startTime)) / 60000;
    currentLoadingTime = Math.max(0.1, Math.min(log.loadingTime, elapsedMinutes));
  }

  let stdSpeed = log.product.stdSpeedFilling || log.product.stdSpeedFbMin || 120;
  if (log.product.machineSpeeds && log.product.machineSpeeds.length > 0) {
    const { machineStates } = require("./mqttListener");
    
    // Filter machine speeds for machines that are currently in RUN state
    const runningSpeeds = log.product.machineSpeeds.filter(ms => {
      const state = machineStates[ms.machineId] || "RUN";
      return state === "RUN";
    });

    if (runningSpeeds.length > 0) {
      const activeSpeedSum = runningSpeeds.reduce((sum, ms) => sum + ms.speed, 0);
      if (activeSpeedSum > 0) {
        stdSpeed = activeSpeedSum;
      }
    } else {
      const customSpeed = log.product.machineSpeeds.find(ms => ms.machineId === log.machineId);
      if (customSpeed && customSpeed.speed > 0) {
        stdSpeed = customSpeed.speed;
      }
    }
  }
  const logOperatingTime = Math.max(0, currentLoadingTime - logDowntime - logMI);
  const logNetOperatingTime = log.totalOutput / stdSpeed;
  const logDefectLoss = (log.rework + log.reject) / stdSpeed;
  const logValuedOperatingTime = Math.max(0, logNetOperatingTime - logDefectLoss);

  // 4. Calculate Core Rates
  const avail = currentLoadingTime > 0 ? (logOperatingTime / currentLoadingTime) * 100 : 0;
  const perf = logOperatingTime > 0 ? (logNetOperatingTime / logOperatingTime) * 100 : 0;
  const qual = logNetOperatingTime > 0 ? (logValuedOperatingTime / logNetOperatingTime) * 100 : 0;
  const logOee = (avail / 100) * (perf / 100) * (qual / 100) * 100;

  // 5. Persist OEE values physically in database
  const updatedLog = await client.okpLog.update({
    where: { id: okpLogId },
    data: {
      availability: parseFloat(avail.toFixed(1)),
      performance: parseFloat(perf.toFixed(1)),
      quality: parseFloat(qual.toFixed(1)),
      oee: parseFloat(logOee.toFixed(1)),
      downtime: parseFloat(logDowntime.toFixed(1)),
      mi: parseFloat(logMI.toFixed(1)),
      updatedAt: new Date(),
    },
  });

  return updatedLog;
}

async function startOeeRealTimeTicker() {
  const { db } = require("./db");
  const { broadcastEvent } = require("./realtime");

  // console.log("[OEE Ticker] Starting OEE Real-Time Recalculation Ticker (every 10 seconds)...");

  setInterval(async () => {
    try {
      // Find all OKP logs that have an open activity (endTime is null)
      const activeOkps = await db.okpLog.findMany({
        where: {
          activities: {
            some: { endTime: null }
          }
        },
        include: {
          machine: true
        }
      });

      for (const okp of activeOkps) {
        // Recalculate OEE in DB
        const recalculated = await recalculateOkpLogOee(okp.id, db);
        
        if (recalculated) {
          // Broadcast to all SSE clients to update the UI in real-time
          broadcastEvent("counter_pulse", {
            okpLogId: recalculated.id,
            okpNumber: recalculated.okpNumber,
            totalOutput: recalculated.totalOutput,
            oee: recalculated.oee,
            availability: recalculated.availability,
            performance: recalculated.performance,
            quality: recalculated.quality,
            qty: 0,
            timestamp: new Date().toISOString()
          }, okp.machine.lineProcessId);
        }
      }
    } catch (err) {
      if (err.message && err.message.includes("Can't reach database server")) {
        // Suppress verbose stack trace when database service is offline/restarting
      } else {
        console.error("[OEE Ticker] Error in periodic OEE recalculation:", err.message || err);
      }
    }
  }, 10000); // Every 10 seconds
}

module.exports = {
  recalculateOkpLogOee,
  startOeeRealTimeTicker,
};
