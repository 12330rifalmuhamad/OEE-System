const { db } = require("./db");

async function recalculateOkpLogOee(okpLogId, prismaTx = null) {
  const client = prismaTx || db;
  
  // 1. Fetch OKP Log along with relations
  const log = await client.okpLog.findUnique({
    where: { id: okpLogId },
    include: {
      product: true,
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

  // 2. Separate Downtime vs Minor Stoppages (MI)
  let logDowntime = 0;
  let logMI = 0;

  log.activities.forEach((act) => {
    const categoryCode = act.activityCode?.category?.code;
    let actDuration = act.duration;
    
    if (act.endTime === null) {
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
  const stdSpeed = log.product.standarSpeed || 1;
  const logOperatingTime = log.loadingTime - logDowntime - logMI;
  const logNetOperatingTime = log.totalOutput / stdSpeed;
  const logDefectLoss = (log.rework + log.reject) / stdSpeed;
  const logValuedOperatingTime = Math.max(0, logNetOperatingTime - logDefectLoss);

  // 4. Calculate Core Rates
  const avail = log.loadingTime > 0 ? (logOperatingTime / log.loadingTime) * 100 : 0;
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

module.exports = {
  recalculateOkpLogOee,
};
