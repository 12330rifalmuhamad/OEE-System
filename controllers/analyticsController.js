const { db } = require("../lib/db");

async function getOeeAnalytics(req, res) {
  try {
    const startDateParam = req.query.startDate || req.query.date;
    const endDateParam = req.query.endDate || req.query.date;
    const okpParam = req.query.okp;
    const machineIdParam = req.query.machineId;
    const lineIdParam = req.query.lineId || req.query.lineProcessId || req.query.line;
    const shiftParam = req.query.shift;

    const dateFilter = {};
    if (startDateParam) {
      const start = new Date(startDateParam);
      start.setUTCHours(0, 0, 0, 0);
      dateFilter.gte = start;
    }
    if (endDateParam) {
      const end = new Date(endDateParam);
      end.setUTCHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    let companyId;
    if (req.user) {
      companyId = req.user.companyId;
    } else {
      const firstCompany = await db.company.findFirst();
      companyId = firstCompany ? firstCompany.id : 1;
    }

    const whereClause = { companyId };
    if (startDateParam || endDateParam) {
      whereClause.date = dateFilter;
    }
    if (okpParam) {
      whereClause.okpNumber = okpParam;
    }
    if (machineIdParam) {
      whereClause.machineId = parseInt(machineIdParam, 10);
    } else if (lineIdParam) {
      const lineIdInt = parseInt(lineIdParam, 10);
      if (!isNaN(lineIdInt)) {
        const machinesInLine = await db.machine.findMany({
          where: { lineProcessId: lineIdInt, companyId },
          select: { id: true }
        });
        const machineIds = machinesInLine.map(m => m.id);
        whereClause.machineId = { in: machineIds };
      }
    }
    if (shiftParam) {
      whereClause.shift = parseInt(shiftParam, 10);
    }

    // Fetch OKP logs
    const okpLogs = await db.okpLog.findMany({
      where: whereClause,
      include: {
        product: true,
        machine: true,
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

    if (okpLogs.length === 0) {
      return res.json({
        summary: {
          oee: 0,
          availability: 0,
          performance: 0,
          quality: 0,
          loadingTime: 0,
          operatingTime: 0,
          performanceLoss: 0,
          netOperatingTime: 0,
          defectLoss: 0,
          valuedOperatingTime: 0,
        },
        pareto: [],
        machineOee: [],
        timeline: [],
        latestOkp: null,
      });
    }

    // Aggregates for company summary
    let totalLoadingTime = 0;
    let totalDowntime = 0;
    let totalMI = 0;
    let totalOperatingTime = 0;
    let totalPerformanceLoss = 0;
    let totalNetOperatingTime = 0;
    let totalDefectLoss = 0;
    let totalValuedOperatingTime = 0;
    let totalActualOutput = 0;
    let totalRework = 0;
    let totalReject = 0;
    let totalStdSpeed = 0;
    let okpCount = 0;

    // Pareto buckets
    const paretoCategories = {};

    // Machine-specific stats
    const machineStats = {};

    okpLogs.forEach((log) => {
      // 1. Gather raw inputs from this OKP log
      const loadingTime = log.loadingTime;
      const actualOutput = log.totalOutput;
      const rework = log.rework;
      const reject = log.reject;
      const stdSpeed = log.product.standarSpeed || 1; // Safeguard division

      // 2. Sort activities chronologically by startTime, falling back to id order
      const sortedActivities = [...log.activities].sort((a, b) => {
        if (a.startTime && b.startTime) {
          return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
        }
        return a.id - b.id;
      });

      // 3. Separate Downtime vs Minor Stoppages (MI)
      let logDowntime = 0;
      let logMI = 0;
      let logDowntimeCount = 0;
      let lastActivityCategory = "";

      sortedActivities.forEach((act) => {
        const categoryCode = act.activityCode.category.code;
        const categoryName = act.activityCode.category.name;

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

        // Accumulate Pareto chart data (for any downtime loss or minor stoppages)
        if (categoryCode !== "PR") {
          if (!paretoCategories[categoryCode]) {
            paretoCategories[categoryCode] = { minutes: 0, count: 0, name: categoryName };
          }
          paretoCategories[categoryCode].minutes += actDuration;
          
          // CONSECUTIVE SERIES RULE: If identical categories occur in series, their combined frequency = 1.
          if (categoryCode !== lastActivityCategory) {
            paretoCategories[categoryCode].count += 1;
            logDowntimeCount += 1;
            lastActivityCategory = categoryCode;
          }
        } else {
          // If it is a PR (Uptime / Produksi Lancar) log, reset the consecutive sequence tracker
          lastActivityCategory = "PR";
        }
      });

      // 4. Apply Master Formulas per Row / OKP Log
      const logOperatingTime = loadingTime - logDowntime - logMI;
      const logNetOperatingTime = actualOutput / stdSpeed;
      const logPerformanceLoss = Math.max(0, logOperatingTime - logNetOperatingTime);
      const logDefectLoss = (rework + reject) / stdSpeed;
      const logValuedOperatingTime = Math.max(0, logNetOperatingTime - logDefectLoss);

      // 5. Accumulate totals
      totalLoadingTime += loadingTime;
      totalDowntime += logDowntime;
      totalMI += logMI;
      totalOperatingTime += logOperatingTime;
      totalPerformanceLoss += logPerformanceLoss;
      totalNetOperatingTime += logNetOperatingTime;
      totalDefectLoss += logDefectLoss;
      totalValuedOperatingTime += logValuedOperatingTime;
      totalActualOutput += actualOutput;
      totalRework += rework;
      totalReject += reject;
      totalStdSpeed += stdSpeed;
      okpCount += 1;

      // 6. Accumulate Machine stats
      if (!machineStats[log.machineId]) {
        machineStats[log.machineId] = {
          name: log.machine.name,
          loading: 0,
          downtime: 0,
          mi: 0,
          operating: 0,
          actualOutput: 0,
          rework: 0,
          reject: 0,
          perfLoss: 0,
          netOperating: 0,
          defectLoss: 0,
          valuedOperating: 0,
          downtimeCount: 0,
        };
      }
      const m = machineStats[log.machineId];
      m.loading += loadingTime;
      m.downtime += logDowntime;
      m.mi += logMI;
      m.operating += logOperatingTime;
      m.actualOutput += actualOutput;
      m.rework += rework;
      m.reject += reject;
      m.perfLoss += logPerformanceLoss;
      m.netOperating += logNetOperatingTime;
      m.defectLoss += logDefectLoss;
      m.valuedOperating += logValuedOperatingTime;
      m.downtimeCount += logDowntimeCount;
    });

    // 7. Calculate Aggregated Core Rates
    const availabilityRate = totalLoadingTime > 0 ? (totalOperatingTime / totalLoadingTime) * 100 : 0;
    const performanceRate = totalOperatingTime > 0 ? (totalNetOperatingTime / totalOperatingTime) * 100 : 0;
    const qualityRate = totalNetOperatingTime > 0 ? (totalValuedOperatingTime / totalNetOperatingTime) * 100 : 0;
    const oee = (availabilityRate / 100) * (performanceRate / 100) * (qualityRate / 100) * 100;

    // Format Pareto Chart data
    const paretoData = Object.keys(paretoCategories)
      .map((code) => ({
        code,
        name: paretoCategories[code].name,
        minutes: parseFloat(paretoCategories[code].minutes.toFixed(1)),
        count: paretoCategories[code].count,
      }))
      .sort((a, b) => b.minutes - a.minutes);

    // Format Machine OEE breakdown list with Master Formula keys
    const machineOeeData = Object.keys(machineStats).map((id) => {
      const m = machineStats[id];
      const mAvail = m.loading > 0 ? (m.operating / m.loading) * 100 : 0;
      const mPerf = m.operating > 0 ? (m.netOperating / m.operating) * 100 : 0;
      const mQual = m.netOperating > 0 ? (m.valuedOperating / m.netOperating) * 100 : 0;
      const mOee = (mAvail / 100) * (mPerf / 100) * (mQual / 100) * 100;

      return {
        id,
        name: m.name,
        oee: parseFloat(mOee.toFixed(1)),
        availability: parseFloat(mAvail.toFixed(1)),
        performance: parseFloat(mPerf.toFixed(1)),
        quality: parseFloat(mQual.toFixed(1)),
        loadingTime: parseFloat(m.loading.toFixed(1)),
        operatingTime: parseFloat(m.operating.toFixed(1)),
        performanceLoss: parseFloat(m.perfLoss.toFixed(1)),
        netOperatingTime: parseFloat(m.netOperating.toFixed(1)),
        defectLoss: parseFloat(m.defectLoss.toFixed(1)),
        valuedOperatingTime: parseFloat(m.valuedOperating.toFixed(1)),
        downtimeCount: m.downtimeCount,
      };
    });

    // OKP Timeline for linear chart trend
    const timelineData = okpLogs
      .map((log) => {
        return {
          okpNumber: log.okpNumber,
          date: log.date.toISOString().split("T")[0],
          oee: log.oee || 0,
          availability: log.availability || 0,
          performance: log.performance || 0,
          quality: log.quality || 0,
        };
      })
      .slice(-15);

    // Determine latest OKP and machine state
    let latestOkpDetails = null;
    if (okpLogs.length > 0) {
      const sortedLogs = [...okpLogs].sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        if (timeB !== timeA) return timeB - timeA;
        return b.id - a.id;
      });
      const latestOkp = sortedLogs[0];

      // Check machine state
      const activeActivity = latestOkp.activities.find(act => act.endTime === null);
      let status = "STOPPED";
      if (activeActivity) {
        status = activeActivity.activityCode.category.code === "PR" ? "RUNNING" : "STOPPED";
      }

      // Calculate operating time for running time display
      let logDowntime = 0;
      let logMI = 0;
      latestOkp.activities.forEach((act) => {
        const categoryCode = act.activityCode.category.code;
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
      
      const logOperatingTime = Math.max(0, latestOkp.loadingTime - logDowntime - logMI);
      const totalSeconds = Math.floor(logOperatingTime * 60);
      const hrs = Math.floor(totalSeconds / 3600);
      const mins = Math.floor((totalSeconds % 3600) / 60);
      const secs = totalSeconds % 60;
      const runningTimeStr = [
        String(hrs).padStart(2, "0"),
        String(mins).padStart(2, "0"),
        String(secs).padStart(2, "0")
      ].join(":");

      latestOkpDetails = {
        okpNumber: latestOkp.okpNumber,
        productName: latestOkp.product.name,
        operator: latestOkp.operator || "SYSTEM",
        status,
        runningTime: runningTimeStr,
        standardSpeed: latestOkp.product.standarSpeed,
      };
    }

    return res.json({
      summary: {
        oee: parseFloat(oee.toFixed(1)),
        availability: parseFloat(availabilityRate.toFixed(1)),
        performance: parseFloat(performanceRate.toFixed(1)),
        quality: parseFloat(qualityRate.toFixed(1)),
        loadingTime: parseFloat(totalLoadingTime.toFixed(1)),
        operatingTime: parseFloat(totalOperatingTime.toFixed(1)),
        performanceLoss: parseFloat(totalPerformanceLoss.toFixed(1)),
        netOperatingTime: parseFloat(totalNetOperatingTime.toFixed(1)),
        defectLoss: parseFloat(totalDefectLoss.toFixed(1)),
        valuedOperatingTime: parseFloat(totalValuedOperatingTime.toFixed(1)),
        totalOutput: parseFloat(totalActualOutput.toFixed(1)),
        rework: parseFloat(totalRework.toFixed(1)),
        reject: parseFloat(totalReject.toFixed(1)),
        standarSpeed: okpCount > 0 ? parseFloat((totalStdSpeed / okpCount).toFixed(1)) : 0,
      },
      pareto: paretoData,
      machineOee: machineOeeData,
      timeline: timelineData,
      latestOkp: latestOkpDetails,
    });
  } catch (error) {
    console.error("GET OEE Analytics Error:", error);
    return res.status(500).json({ error: "Gagal menghitung analitik OEE." });
  }
}

module.exports = {
  getOeeAnalytics,
};
