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
    if ((startDateParam || endDateParam) && !okpParam) {
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

    // 1. Fetch OKP logs WITHOUT activities (extremely lightweight and fast!)
    const okpLogs = await db.okpLog.findMany({
      where: whereClause,
      include: {
        product: true,
        machine: true,
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

    // 2. Fetch all activities for the filtered OKP logs in a separate optimized query
    const paretoActivities = await db.activityLog.findMany({
      where: {
        okpLog: whereClause,
      },
      include: {
        activityCode: {
          include: {
            category: true,
          },
        },
      },
      orderBy: [
        { okpLogId: "asc" },
        { startTime: "asc" },
        { id: "asc" }
      ]
    });

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

    // 3. Process Pareto Activities in a flat loop (efficient and mathematically identical)
    let lastActivityCategory = "";
    let lastOkpId = null;

    paretoActivities.forEach((act) => {
      const categoryCode = act.activityCode.category.code;
      const categoryName = act.activityCode.category.name;

      // Reset consecutive tracking if we switch to a different OKP log
      if (act.okpLogId !== lastOkpId) {
        lastOkpId = act.okpLogId;
        lastActivityCategory = "";
      }

      let actDuration = act.duration;
      if (act.endTime === null) {
        const startTime = act.startTime || act.createdAt || new Date();
        actDuration = parseFloat(((new Date() - new Date(startTime)) / 60000).toFixed(2));
        if (isNaN(actDuration) || actDuration < 0) {
          actDuration = 0;
        }
      }

      if (categoryCode !== "PR") {
        if (!paretoCategories[categoryCode]) {
          paretoCategories[categoryCode] = { minutes: 0, count: 0, name: categoryName };
        }
        paretoCategories[categoryCode].minutes += actDuration;
        
        // CONSECUTIVE SERIES RULE
        if (categoryCode !== lastActivityCategory) {
          paretoCategories[categoryCode].count += 1;
          lastActivityCategory = categoryCode;
        }
      } else {
        lastActivityCategory = "PR";
      }
    });

    // 4. Process OEE metrics using pre-calculated database fields (avoids nested activity loops!)
    okpLogs.forEach((log) => {
      // Check if this OKP log has any active (running/stopped) activity (endTime is null) in paretoActivities
      const hasActiveActivity = paretoActivities.some(
        (act) => act.okpLogId === log.id && act.endTime === null
      );

      let currentLoadingTime = log.loadingTime;
      if (hasActiveActivity) {
        const startTime = log.date || log.createdAt;
        const elapsedMinutes = (new Date() - new Date(startTime)) / 60000;
        currentLoadingTime = Math.max(0.1, Math.min(log.loadingTime, elapsedMinutes));
      }

      const actualOutput = log.totalOutput;
      const rework = log.rework;
      const reject = log.reject;
      const stdSpeed = log.product.standarSpeed || 1;

      let logDowntime = log.downtime || 0;
      let logMI = log.mi || 0;
      let logOperatingTime = 0;
      let logNetOperatingTime = 0;
      let logPerformanceLoss = 0;
      let logDefectLoss = 0;
      let logValuedOperatingTime = 0;

      if (log.totalInput !== null) {
        // Imported log
        logOperatingTime = currentLoadingTime - logDowntime - logMI;
        const pr = log.performance || 0;
        logNetOperatingTime = (pr / 100) * logOperatingTime;
        logPerformanceLoss = Math.max(0, logOperatingTime - logNetOperatingTime);
        const qr = log.quality || 0;
        logValuedOperatingTime = (qr / 100) * logNetOperatingTime;
        logDefectLoss = Math.max(0, logNetOperatingTime - logValuedOperatingTime);

        // Accumulate Pareto chart data for imported log
        if (logDowntime > 0) {
          const categoryCode = "OT";
          const categoryName = "Others (Imported)";
          if (!paretoCategories[categoryCode]) {
            paretoCategories[categoryCode] = { minutes: 0, count: 0, name: categoryName };
          }
          paretoCategories[categoryCode].minutes += logDowntime;
          paretoCategories[categoryCode].count += 1;
        }
      } else {
        // Sensor-based log (using pre-calculated database columns!)
        logOperatingTime = Math.max(0, currentLoadingTime - logDowntime - logMI);
        logNetOperatingTime = actualOutput / stdSpeed;
        logPerformanceLoss = Math.max(0, logOperatingTime - logNetOperatingTime);
        logDefectLoss = (rework + reject) / stdSpeed;
        logValuedOperatingTime = Math.max(0, logNetOperatingTime - logDefectLoss);
      }

      // Accumulate totals
      totalLoadingTime += currentLoadingTime;
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

      // Accumulate Machine stats
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
      m.loading += currentLoadingTime;
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
    });

    // Calculate Aggregated Core Rates
    let availabilityRate = totalLoadingTime > 0 ? (totalOperatingTime / totalLoadingTime) * 100 : 0;
    let performanceRate = totalOperatingTime > 0 ? (totalNetOperatingTime / totalOperatingTime) * 100 : 0;
    let qualityRate = totalNetOperatingTime > 0 ? (totalValuedOperatingTime / totalNetOperatingTime) * 100 : 0;
    let oee = (availabilityRate / 100) * (performanceRate / 100) * (qualityRate / 100) * 100;

    // Overwrite for single OKP log response to prevent precision / rounding mismatch with database columns
    if (okpLogs.length === 1) {
      const singleLog = okpLogs[0];
      availabilityRate = singleLog.availability !== null ? singleLog.availability : availabilityRate;
      performanceRate = singleLog.performance !== null ? singleLog.performance : performanceRate;
      qualityRate = singleLog.quality !== null ? singleLog.quality : qualityRate;
      oee = singleLog.oee !== null ? singleLog.oee : oee;
    }

    // Format Pareto Chart data
    const paretoData = Object.keys(paretoCategories)
      .map((code) => ({
        code,
        name: paretoCategories[code].name,
        minutes: parseFloat(paretoCategories[code].minutes.toFixed(1)),
        count: paretoCategories[code].count,
      }))
      .sort((a, b) => b.minutes - a.minutes);

    // Format Machine OEE breakdown list
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

      // Fetch activities only for the latest OKP (incredibly fast, avoids massive nested join!)
      const latestActivities = await db.activityLog.findMany({
        where: { okpLogId: latestOkp.id },
        include: {
          activityCode: {
            include: { category: true }
          }
        }
      });

      // Check machine state
      const activeActivity = latestActivities.find(act => act.endTime === null);
      let status = "STOPPED";
      if (activeActivity) {
        status = activeActivity.activityCode.category.code === "PR" ? "RUNNING" : "STOPPED";
      }

      // Calculate operating time for running time display
      let logDowntime = 0;
      let logMI = 0;
      latestActivities.forEach((act) => {
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
        id: latestOkp.id,
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
      okpLogs: okpLogs.map(log => ({
        id: log.id,
        okpNumber: log.okpNumber,
        date: log.date.toISOString().split("T")[0],
        shift: log.shift,
        machineName: log.machine.name,
        productName: log.product.name,
        totalOutput: log.totalOutput,
        availability: log.availability,
        performance: log.performance,
        quality: log.quality,
        oee: log.oee,
        downtime: log.downtime,
      })),
    });
  } catch (error) {
    console.error("GET OEE Analytics Error:", error);
    return res.status(500).json({ error: "Gagal menghitung analitik OEE." });
  }
}

module.exports = {
  getOeeAnalytics,
};
