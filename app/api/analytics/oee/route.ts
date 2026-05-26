import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Tidak terautentikasi." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const endDateParam = searchParams.get("endDate");

    const dateFilter: any = {};
    if (startDateParam) dateFilter.gte = new Date(startDateParam);
    if (endDateParam) dateFilter.lte = new Date(endDateParam);

    const whereClause: any = { companyId: user.companyId };
    if (startDateParam || endDateParam) {
      whereClause.date = dateFilter;
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
      return NextResponse.json({
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

    // Pareto buckets
    const paretoCategories: Record<string, { minutes: number; count: number; name: string }> = {};

    // Machine-specific stats
    const machineStats: Record<
      string,
      {
        name: string;
        loading: number;
        downtime: number;
        mi: number;
        operating: number;
        actualOutput: number;
        rework: number;
        reject: number;
        perfLoss: number;
        netOperating: number;
        defectLoss: number;
        valuedOperating: number;
      }
    > = {};

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
      let lastActivityCategory = "";

      sortedActivities.forEach((act) => {
        const categoryCode = act.activityCode.category.code;
        const categoryName = act.activityCode.category.name;

        if (categoryCode === "MI") {
          logMI += act.duration;
        } else if (categoryCode !== "PR") {
          logDowntime += act.duration;
        }

        // Accumulate Pareto chart data (for any downtime loss or minor stoppages)
        if (categoryCode !== "PR") {
          if (!paretoCategories[categoryCode]) {
            paretoCategories[categoryCode] = { minutes: 0, count: 0, name: categoryName };
          }
          paretoCategories[categoryCode].minutes += act.duration;
          
          // CONSECUTIVE SERIES RULE: If identical categories occur in series, their combined frequency = 1.
          if (categoryCode !== lastActivityCategory) {
            paretoCategories[categoryCode].count += 1;
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
      };
    });

    // OKP Timeline for linear chart trend
    const timelineData = okpLogs
      .map((log) => {
        let logDowntime = 0;
        let logMI = 0;
        log.activities.forEach((act) => {
          if (act.activityCode.category.code === "MI") {
            logMI += act.duration;
          } else if (act.activityCode.category.code !== "PR") {
            logDowntime += act.duration;
          }
        });
        const stdSpeed = log.product.standarSpeed || 1;
        const logOperatingTime = log.loadingTime - logDowntime - logMI;
        const logNetOperatingTime = log.totalOutput / stdSpeed;
        const logDefectLoss = (log.rework + log.reject) / stdSpeed;
        const logValuedOperatingTime = Math.max(0, logNetOperatingTime - logDefectLoss);

        const avail = log.loadingTime > 0 ? (logOperatingTime / log.loadingTime) * 100 : 0;
        const perf = logOperatingTime > 0 ? (logNetOperatingTime / logOperatingTime) * 100 : 0;
        const qual = logNetOperatingTime > 0 ? (logValuedOperatingTime / logNetOperatingTime) * 100 : 0;
        const logOee = (avail / 100) * (perf / 100) * (qual / 100) * 100;

        return {
          okpNumber: log.okpNumber,
          date: log.date.toISOString().split("T")[0],
          oee: parseFloat(logOee.getTime ? logOee.toFixed(1) : logOee.toFixed(1)),
        };
      })
      .slice(-15);

    return NextResponse.json({
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
      },
      pareto: paretoData,
      machineOee: machineOeeData,
      timeline: timelineData,
    });
  } catch (error) {
    console.error("GET OEE Analytics Error:", error);
    return NextResponse.json({ error: "Gagal menghitung analitik OEE." }, { status: 500 });
  }
}
