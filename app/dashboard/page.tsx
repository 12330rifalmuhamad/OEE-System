"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Clock,
  Cpu,
  RefreshCw,
  TrendingUp,
  AlertTriangle,
  Calendar,
  Layers,
  ArrowRight,
  Gauge,
  Calculator,
  Download,
  CheckCircle,
  Activity,
  Layers3,
  Server,
  Filter,
  CheckCircle2,
  AlertOctagon,
  FileSpreadsheet,
  ActivitySquare
} from "lucide-react";
import Link from "next/link";

const ReactECharts = dynamic(() => import("echarts-for-react"), { ssr: false });

interface OeeSummary {
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  loadingTime: number;
  operatingTime: number;
  performanceLoss: number;
  netOperatingTime: number;
  defectLoss: number;
  valuedOperatingTime: number;
  totalOutput: number;
  rework: number;
  reject: number;
  standarSpeed: number;
}

interface ParetoItem {
  code: string;
  name: string;
  minutes: number;
  count: number;
}

interface MachineOee {
  id: string;
  name: string;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
  loadingTime: number;
  operatingTime: number;
  performanceLoss: number;
  netOperatingTime: number;
  defectLoss: number;
  valuedOperatingTime: number;
  downtimeCount: number;
}

interface TimelineItem {
  okpNumber: string;
  date: string;
  oee: number;
  availability: number;
  performance: number;
  quality: number;
}

export default function OeeDashboardHome() {
  const [summary, setSummary] = useState<OeeSummary>({
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
    totalOutput: 0,
    rework: 0,
    reject: 0,
    standarSpeed: 0,
  });

  const [pareto, setPareto] = useState<ParetoItem[]>([]);
  const [machines, setMachines] = useState<MachineOee[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedOkp, setSelectedOkp] = useState("");
  const [selectedMachine, setSelectedMachine] = useState("");
  const [selectedShift, setSelectedShift] = useState("");

  // Lists for dropdown selectors
  const [okpList, setOkpList] = useState<any[]>([]);
  const [machineList, setMachineList] = useState<any[]>([]);

  // Theme tracking for ECharts color synchronization
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [liveTime, setLiveTime] = useState("");
  const [liveDate, setLiveDate] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const root = document.documentElement;
    const currentTheme = root.getAttribute("data-theme") as "light" | "dark" || "light";
    setTheme(currentTheme);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "data-theme") {
          const newTheme = root.getAttribute("data-theme") as "light" | "dark" || "light";
          setTheme(newTheme);
        }
      });
    });

    observer.observe(root, { attributes: true });

    // Update live clock
    const updateTime = () => {
      const now = new Date();
      setLiveTime(now.toTimeString().split(" ")[0]);
      setLiveDate(
        now.toLocaleDateString("id-ID", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        })
      );
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);

    return () => {
      observer.disconnect();
      clearInterval(clockInterval);
    };
  }, []);

  const fetchAnalytics = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError("");
    try {
      let url = "/api/analytics/oee";
      const params = [];
      if (selectedDate) {
        params.push(`date=${selectedDate}`);
      }
      if (selectedOkp) {
        params.push(`okp=${selectedOkp}`);
      }
      if (selectedMachine) {
        params.push(`machineId=${selectedMachine}`);
      }
      if (selectedShift) {
        params.push(`shift=${selectedShift}`);
      }

      if (params.length > 0) url += `?${params.join("&")}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setPareto(data.pareto);
        setMachines(data.machineOee);
        setTimeline(data.timeline || []);
      } else {
        setError("Gagal memuat analitik OEE.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server analitik.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  const fetchOkps = async () => {
    try {
      const res = await fetch("/api/transactions/okp");
      if (res.ok) {
        const data = await res.json();
        setOkpList(data.okpLogs || []);
      }
    } catch (err) {
      console.error("Gagal mengambil daftar OKP:", err);
    }
  };

  const fetchMachines = async () => {
    try {
      const res = await fetch("/api/master/machines");
      if (res.ok) {
        const data = await res.json();
        setMachineList(data.machines || []);
      }
    } catch (err) {
      console.error("Gagal mengambil daftar mesin:", err);
    }
  };

  useEffect(() => {
    fetchAnalytics(false);
    fetchOkps();
    fetchMachines();

    const interval = setInterval(() => {
      fetchAnalytics(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [selectedDate, selectedOkp, selectedMachine, selectedShift]);

  // Reset all filters
  const resetFilters = () => {
    setSelectedDate("");
    setSelectedOkp("");
    setSelectedMachine("");
    setSelectedShift("");
  };

  // Export report to CSV
  const exportToCSV = () => {
    const headers = ["Metric", "Value"];
    const rows = [
      ["OEE", `${summary.oee}%`],
      ["Availability", `${summary.availability}%`],
      ["Performance", `${summary.performance}%`],
      ["Quality", `${summary.quality}%`],
      ["Planned Production Time (PPT)", `${summary.loadingTime} min`],
      ["Operating Time", `${summary.operatingTime} min`],
      ["Net Operating Time", `${summary.netOperatingTime} min`],
      ["Downtime", `${(summary.loadingTime - summary.operatingTime).toFixed(1)} min`],
      ["Total Output", `${summary.totalOutput} pcs`],
      ["Rework", `${summary.rework} pcs`],
      ["Reject", `${summary.reject} pcs`],
      ["Standard Speed", `${summary.standarSpeed} pcs/m`],
    ];
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `OEE_Report_${selectedDate || "all"}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Theme-aware color variables
  const isDark = theme === "dark";
  const textColor = isDark ? "#a7f3d0" : "#6b7280";
  const textPrimaryColor = isDark ? "#f3f4f6" : "#1f2937";
  const gridLineColor = isDark ? "rgba(4, 120, 87, 0.2)" : "rgba(209, 213, 219, 0.5)";
  const tooltipBg = isDark ? "#022c22" : "#ffffff";
  const tooltipBorder = isDark ? "#047857" : "#d1d5db";

  // ECharts semi-circular dial gauge configuration
  const getOeeGaugeOption = () => {
    return {
      backgroundColor: "transparent",
      series: [
        {
          type: "gauge",
          startAngle: 180,
          endAngle: 0,
          min: 0,
          max: 100,
          radius: "105%",
          center: ["50%", "75%"],
          axisLine: {
            lineStyle: {
              width: 14,
              color: [
                [0.70, "#ef4444"], // Red
                [0.85, "#f59e0b"], // Orange
                [1.00, "#10b981"]  // Green
              ]
            }
          },
          pointer: {
            icon: "path://M12.8,0.7l12,80.1c1.2,7.8-3.7,15.1-11.5,16.3c-7.8,1.2-15.1-3.7-16.3-11.5c-0.2-1.5-0.2-3,0.1-4.5L9.1,0.7C9.3-0.2,10.2-0.3,10.9-0.1C11.7,0.1,12.4,0.3,12.8,0.7z",
            length: "75%",
            width: 6,
            offsetCenter: [0, "5%"],
            itemStyle: {
              color: "auto"
            }
          },
          axisTick: { show: false },
          splitLine: { show: false },
          axisLabel: {
            show: true,
            distance: -22,
            color: textColor,
            fontSize: 9,
            formatter: (val: number) => {
              if (val === 0 || val === 70 || val === 85 || val === 100) return `${val}%`;
              return "";
            }
          },
          title: {
            show: false
          },
          detail: {
            offsetCenter: [0, "15%"],
            valueAnimation: true,
            formatter: (val: number) => `{value|${val.toFixed(1)}}{unit|%}`,
            rich: {
              value: {
                fontSize: 24,
                fontWeight: "bolder",
                color: textPrimaryColor,
                fontFamily: "var(--font-mono)"
              },
              unit: {
                fontSize: 12,
                color: textColor,
                padding: [0, 0, 4, 2]
              }
            }
          },
          data: [{ value: summary.oee, name: "" }]
        }
      ]
    };
  };

  // ECharts Trend Option
  const getTrendOption = () => {
    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: tooltipBg,
        borderColor: tooltipBorder,
        borderWidth: 1,
        textStyle: { color: textPrimaryColor, fontFamily: "var(--font-mono)", fontSize: 10 }
      },
      legend: {
        data: ["OEE", "Availability", "Performance", "Quality"],
        textStyle: { color: textPrimaryColor, fontFamily: "var(--font-sans)", fontSize: 9 },
        top: "0%"
      },
      grid: {
        left: "3%",
        right: "3%",
        top: "18%",
        bottom: "8%",
        containLabel: true
      },
      xAxis: {
        type: "category",
        data: timeline.map((item) => item.okpNumber),
        axisLabel: { color: textColor, fontFamily: "var(--font-mono)", fontSize: 9 },
        axisLine: { lineStyle: { color: tooltipBorder } }
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        axisLabel: { color: textColor, fontFamily: "var(--font-mono)", fontSize: 9, formatter: "{value}%" },
        splitLine: { lineStyle: { color: gridLineColor } },
        axisLine: { lineStyle: { color: tooltipBorder } }
      },
      series: [
        {
          name: "OEE",
          type: "line",
          data: timeline.map((item) => item.oee),
          symbol: "circle",
          symbolSize: 6,
          itemStyle: { color: isDark ? "#10B981" : "#008F4C" },
          lineStyle: { width: 3 },
          areaStyle: {
            color: {
              type: "linear",
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: isDark ? "rgba(16, 185, 129, 0.15)" : "rgba(0, 143, 76, 0.08)" },
                { offset: 1, color: "transparent" }
              ]
            }
          }
        },
        {
          name: "Availability",
          type: "line",
          data: timeline.map((item) => item.availability),
          symbol: "circle",
          symbolSize: 4,
          itemStyle: { color: "#5ebd56" },
          lineStyle: { width: 1.5, type: "dashed" }
        },
        {
          name: "Performance",
          type: "line",
          data: timeline.map((item) => item.performance),
          symbol: "circle",
          symbolSize: 4,
          itemStyle: { color: "#fed130" },
          lineStyle: { width: 1.5, type: "dashed" }
        },
        {
          name: "Quality",
          type: "line",
          data: timeline.map((item) => item.quality),
          symbol: "circle",
          symbolSize: 4,
          itemStyle: { color: "#f2a134" },
          lineStyle: { width: 1.5, type: "dashed" }
        }
      ]
    };
  };

  const getLinkedMachineName = () => {
    if (selectedMachine) {
      const machine = machineList.find((m) => m.id.toString() === selectedMachine);
      return machine ? machine.name : "N/A";
    }
    if (selectedOkp && okpList.length > 0) {
      const active = okpList.find((o) => o.okpNumber === selectedOkp);
      return active && active.machine ? active.machine.name : "N/A";
    }
    return "All FBF Lines";
  };

  // Calculations for time allocation bar
  const ppt = summary.loadingTime || 1;
  const operating = summary.operatingTime;
  const downtime = Math.max(0, summary.loadingTime - summary.operatingTime);
  const netOperating = summary.netOperatingTime;
  const perfLoss = Math.max(0, operating - netOperating);

  const downtimePct = (downtime / ppt) * 100;
  const netPct = (netOperating / ppt) * 100;
  const perfPct = (perfLoss / ppt) * 100;

  return (
    <div className="flex-1 p-4 lg:p-6 flex flex-col gap-5 max-w-7xl mx-auto w-full relative z-10 bg-[var(--bg-base)] transition-colors duration-200">
      
      {/* Dynamic tech background overlay */}
      <div className="tech-bg">
        <div className="tech-grid" />
      </div>

      {/* 1. SCADA-STYLE HEADER PANEL */}
      <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[var(--border-color)] pb-4">
        
        {/* Title & Live Status */}
        <div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] animate-ping" />
            <h1 className="text-lg font-black uppercase tracking-wider text-[var(--text-primary)] font-sans flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[var(--primary-brand)]" />
              <span>OEE DASHBOARD</span>
            </h1>
            <span className="text-[9px] font-extrabold uppercase bg-[var(--primary-brand)]/15 text-[var(--primary-brand)] border border-[var(--primary-brand)]/30 px-1.5 py-0.5 rounded font-sans">
              Live telemetry
            </span>
          </div>
          <p className="text-[10px] text-[var(--text-secondary)] tracking-wider uppercase font-sans mt-0.5">
            PT. Kalbe Morinaga Indonesia &bull; Plant Monitoring Hub
          </p>
        </div>

        {/* Live Clock Component */}
        <div className="flex items-center gap-4 bg-[var(--bg-card)] border border-[var(--border-color)] px-5 py-3 rounded-2xl shadow-[var(--card-shadow)] font-sans">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex flex-col justify-center">
            <span className="font-extrabold text-[var(--text-primary)] tracking-widest text-[13px] leading-tight font-mono">
              {liveTime || "00:00:00"}
            </span>
            <span className="text-[9px] text-[var(--text-secondary)] uppercase tracking-wider leading-tight font-mono mt-0.5">
              {liveDate ? liveDate.toUpperCase() : "..."}
            </span>
          </div>
        </div>

      </div>

      {/* 2. ADVANCED INTERACTIVE FILTER PANEL */}
      <div className="relative z-10 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3 shadow-[var(--card-shadow)] flex flex-wrap items-center justify-between gap-3 text-xs font-sans">
        <div className="flex flex-wrap items-center gap-3">
          
          {/* Date Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-sans">Date Select</label>
            <div className="flex items-center gap-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-2 py-1">
              <Calendar className="w-3.5 h-3.5 text-[var(--primary-brand)]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none text-[11px] text-[var(--text-primary)] font-sans focus:outline-none p-0 cursor-pointer"
              />
            </div>
          </div>

          {/* Shift Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-sans">Shift</label>
            <div className="flex items-center gap-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-2 py-1">
              <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase font-sans">SH:</span>
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="bg-transparent border-none text-[11px] text-[var(--text-primary)] font-sans focus:outline-none p-0 cursor-pointer font-bold"
              >
                <option value="">ALL SHIFTS</option>
                <option value="1">SHIFT 1</option>
                <option value="2">SHIFT 2</option>
                <option value="3">SHIFT 3</option>
              </select>
            </div>
          </div>

          {/* OKP Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-sans">OKP scope</label>
            <div className="flex items-center gap-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-2 py-1">
              <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase font-sans">OKP:</span>
              <select
                value={selectedOkp}
                onChange={(e) => setSelectedOkp(e.target.value)}
                className="bg-transparent border-none text-[11px] text-[var(--text-primary)] font-sans focus:outline-none p-0 cursor-pointer font-bold max-w-[140px]"
              >
                <option value="">ALL OKPS</option>
                {okpList.map((okp) => (
                  <option key={okp.id} value={okp.okpNumber}>
                    {okp.okpNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Machine Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider font-sans">Machine FBF</label>
            <div className="flex items-center gap-1 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg px-2 py-1">
              <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase font-sans">MC:</span>
              <select
                value={selectedMachine}
                onChange={(e) => setSelectedMachine(e.target.value)}
                className="bg-transparent border-none text-[11px] text-[var(--text-primary)] font-sans focus:outline-none p-0 cursor-pointer font-bold max-w-[140px]"
              >
                <option value="">ALL MACHINES</option>
                {machineList.map((m) => (
                  <option key={m.id} value={m.id.toString()}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 mt-auto">
          {/* Refresh / Reset Filters Button */}
          <button
            onClick={resetFilters}
            className="px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--primary-brand)] hover:border-[var(--primary-brand)]/30 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 font-sans text-[10px] font-bold uppercase tracking-wider"
            title="Reset Filters"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
            <span>Clear</span>
          </button>

          {/* Export Report CSV Button */}
          <button
            onClick={exportToCSV}
            className="px-3 py-1.5 bg-[var(--primary-brand)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 font-sans text-[10px] font-bold uppercase tracking-wider shadow-sm"
          >
            <Download className="w-3 h-3" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="relative z-10 bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-xl text-xs font-semibold flex items-center gap-2 font-sans">
          <AlertOctagon className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* 3. SIX CARD INDICATORS ROW */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 font-sans">
        
        {/* Indicator 1: OEE */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center gap-4 transition-all hover:scale-[1.02] hover:shadow-md border-l-4 border-l-[#10b981]">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex-shrink-0">
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Overall OEE</span>
            <span className="text-2xl font-black text-[var(--text-primary)] font-mono leading-tight my-0.5">{summary.oee}%</span>
            <span className="text-[9px] text-[var(--text-secondary)] font-medium">
              Target: <span className="text-emerald-600 font-bold font-mono">85.0%</span>
            </span>
          </div>
        </div>

        {/* Indicator 2: Availability */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center gap-4 transition-all hover:scale-[1.02] hover:shadow-md border-l-4 border-l-[#10b981]">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-600 flex-shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Availability</span>
            <span className="text-2xl font-black text-[var(--text-primary)] font-mono leading-tight my-0.5">{summary.availability}%</span>
            <span className="text-[9px] text-[var(--text-secondary)] font-medium">
              Target: <span className="text-emerald-600 font-bold font-mono">90.0%</span>
            </span>
          </div>
        </div>

        {/* Indicator 3: Performance */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center gap-4 transition-all hover:scale-[1.02] hover:shadow-md border-l-4 border-l-[#fed130]">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex-shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Performance</span>
            <span className="text-2xl font-black text-[var(--text-primary)] font-mono leading-tight my-0.5">{summary.performance}%</span>
            <span className="text-[9px] text-[var(--text-secondary)] font-medium">
              Target: <span className="text-amber-500 font-bold font-mono">95.0%</span>
            </span>
          </div>
        </div>

        {/* Indicator 4: Quality */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center gap-4 transition-all hover:scale-[1.02] hover:shadow-md border-l-4 border-l-[#f2a134]">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-orange-500/10 text-orange-500 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="m9 12 2 2 4-4"/>
            </svg>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Quality</span>
            <span className="text-2xl font-black text-[var(--text-primary)] font-mono leading-tight my-0.5">{summary.quality}%</span>
            <span className="text-[9px] text-[var(--text-secondary)] font-medium">
              Target: <span className="text-orange-500 font-bold font-mono">99.0%</span>
            </span>
          </div>
        </div>

        {/* Indicator 5: PPT (Planned Production Time) */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center gap-4 transition-all hover:scale-[1.02] hover:shadow-md border-l-4 border-l-[#3b82f6]">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 flex-shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Planned Time</span>
            <span className="text-2xl font-black text-[var(--text-primary)] font-mono leading-tight my-0.5">{summary.loadingTime} <span className="text-[10px] font-semibold text-[var(--text-secondary)] font-sans">m</span></span>
            <span className="text-[9px] text-[var(--text-secondary)] font-medium">Shift load limit</span>
          </div>
        </div>

        {/* Indicator 6: Total Count */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4 shadow-[var(--card-shadow)] flex items-center gap-4 transition-all hover:scale-[1.02] hover:shadow-md border-l-4 border-l-[#6366f1]">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-indigo-500/10 text-indigo-500 flex-shrink-0">
            <ActivitySquare className="w-5 h-5" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">Total Count</span>
            <span className="text-2xl font-black text-[var(--text-primary)] font-mono leading-tight my-0.5">{(summary.totalOutput || 0).toLocaleString("en-US")} <span className="text-[10px] font-semibold text-[var(--text-secondary)] font-sans">pcs</span></span>
            <span className="text-[9px] text-[var(--text-secondary)] font-medium">Speed: {summary.standarSpeed || 1} pcs/m</span>
          </div>
        </div>

      </div>

      {/* 4. INTERACTIVE VISUAL ROW (GAUGE & MATH PROGRESS BARS) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card: Speedometer Gauge + Horizontal Components */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-[var(--card-shadow)] flex flex-col justify-between min-h-[360px]">
          
          <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2.5 mb-4">
            <div className="flex items-center gap-2 font-sans">
              <Gauge className="w-4.5 h-4.5 text-[var(--primary-brand)]" />
              <h2 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">OEE Speedometer & Component Targets</h2>
            </div>
            <span className="text-[8px] bg-[var(--primary-brand)]/15 text-[var(--primary-brand)] font-bold px-1.5 py-0.5 rounded border border-[var(--primary-brand)]/20 font-sans">
              Visual dial
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center flex-1">
            
            {/* Speedometer Gauge Dial */}
            <div className="w-full h-[180px] relative flex items-center justify-center">
              {loading ? (
                <div className="flex items-center justify-center text-xs text-[var(--text-secondary)] italic">
                  Calculating gauge...
                </div>
              ) : (
                <ReactECharts option={getOeeGaugeOption()} style={{ height: "100%", width: "100%" }} />
              )}
            </div>

            {/* Component Targets Progress Bars */}
            <div className="flex flex-col gap-4 font-sans text-xs">
              
              {/* Availability Progress Bar */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[var(--text-secondary)] font-bold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#5ebd56]" />
                    <span>Availability</span>
                    <span className="text-[8px] font-normal text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 font-sans">Target: 90%</span>
                  </span>
                  <span className="text-[var(--text-primary)] font-extrabold font-mono">{summary.availability}%</span>
                </div>
                <div className="relative w-full h-3.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-full overflow-visible">
                  <div
                    className="h-full bg-gradient-to-r from-[#4cae44] to-[#5ebd56] rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, summary.availability)}%` }}
                  />
                  {/* Target line at 90% */}
                  <div
                    className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-rose-500 z-10"
                    style={{ left: "90%" }}
                  />
                </div>
              </div>

              {/* Performance Progress Bar */}
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex justify-between items-center text-[var(--text-secondary)] font-bold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#fed130]" />
                    <span>Performance</span>
                    <span className="text-[8px] font-normal text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 font-sans">Target: 95%</span>
                  </span>
                  <span className="text-[var(--text-primary)] font-extrabold font-mono">{summary.performance}%</span>
                </div>
                <div className="relative w-full h-3.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-full overflow-visible">
                  <div
                    className="h-full bg-gradient-to-r from-[#e5bd25] to-[#fed130] rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, summary.performance)}%` }}
                  />
                  {/* Target line at 95% */}
                  <div
                    className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-rose-500 z-10"
                    style={{ left: "95%" }}
                  />
                </div>
              </div>

              {/* Quality Progress Bar */}
              <div className="flex flex-col gap-1.5 mt-1">
                <div className="flex justify-between items-center text-[var(--text-secondary)] font-bold">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#f2a134]" />
                    <span>Quality</span>
                    <span className="text-[8px] font-normal text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 font-sans">Target: 99%</span>
                  </span>
                  <span className="text-[var(--text-primary)] font-extrabold font-mono">{summary.quality}%</span>
                </div>
                <div className="relative w-full h-3.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-full overflow-visible">
                  <div
                    className="h-full bg-gradient-to-r from-[#d9902b] to-[#f2a134] rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(100, summary.quality)}%` }}
                  />
                  {/* Target line at 99% */}
                  <div
                    className="absolute top-[-3px] bottom-[-3px] w-[2px] bg-rose-500 z-10"
                    style={{ left: "99%" }}
                  />
                </div>
              </div>

            </div>

          </div>

          <div className="flex justify-between items-center text-[9px] text-[var(--text-secondary)] border-t border-[var(--border-color)] pt-2 mt-4 font-sans">
            <span>Overall capability: <span className="text-[var(--primary-brand)] font-bold font-sans">Operational</span></span>
            <span>Target OEE Threshold: <span className="text-[var(--primary-brand)] font-bold font-mono">85.0%</span></span>
          </div>

        </div>

        {/* Right Card: OEE Calculation Panel */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-[var(--card-shadow)] flex flex-col justify-between min-h-[360px]">
          
          <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2.5 mb-4">
            <div className="flex items-center gap-2 font-sans">
              <Calculator className="w-4.5 h-4.5 text-[var(--primary-brand)]" />
              <h2 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">OEE Telemetry Breakdown</h2>
            </div>
            <span className="text-[8px] bg-[var(--primary-brand)]/15 text-[var(--primary-brand)] font-bold px-1.5 py-0.5 rounded border border-[var(--primary-brand)]/20 font-sans">
              SCADA Value
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 flex-1 items-center py-2 font-sans">
            {/* Availability */}
            <div className="border border-[var(--border-color)] rounded-xl p-4 bg-[var(--bg-card)] flex flex-col items-center justify-center h-24 text-center shadow-sm">
              <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-2">Availability</span>
              <span className="text-2xl font-black text-[#10b981] font-mono">{summary.availability}%</span>
            </div>

            {/* Performance */}
            <div className="border border-[var(--border-color)] rounded-xl p-4 bg-[var(--bg-card)] flex flex-col items-center justify-center h-24 text-center shadow-sm">
              <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-2">Performance</span>
              <span className="text-2xl font-black text-[#fed130] font-mono">{summary.performance}%</span>
            </div>

            {/* Quality */}
            <div className="border border-[var(--border-color)] rounded-xl p-4 bg-[var(--bg-card)] flex flex-col items-center justify-center h-24 text-center shadow-sm">
              <span className="text-[10px] text-[var(--text-secondary)] font-bold uppercase tracking-wider mb-2">Quality</span>
              <span className="text-2xl font-black text-[#f2a134] font-mono">{summary.quality}%</span>
            </div>

            {/* OEE Result Box */}
            <div className="border-2 border-emerald-500/60 rounded-xl p-4 bg-emerald-500/5 flex flex-col items-center justify-center h-24 text-center shadow-sm">
              <span className="text-[10px] text-emerald-600 font-black uppercase tracking-wider mb-2">OEE Result</span>
              <span className="text-3xl font-black text-emerald-600 font-mono">{summary.oee}%</span>
            </div>
          </div>

        </div>

      </div>

      {/* 5. BOTTOM ANALYTICAL ROW (TREND, PARETO TABLE, & SUMMARY DETAILS STACK) */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Col 1: OEE Trend Chart */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-[var(--card-shadow)] flex flex-col justify-between min-h-[360px]">
          <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2.5 mb-3 flex-shrink-0">
            <div className="flex items-center gap-2 font-sans">
              <TrendingUp className="w-4 h-4 text-[var(--primary-brand)]" />
              <h2 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">OKP OEE Trend Analysis</h2>
            </div>
            <span className="text-[8px] bg-[var(--primary-brand)]/15 text-[var(--primary-brand)] font-bold px-1.5 py-0.5 rounded border border-[var(--primary-brand)]/20 font-sans">
              Run sequence
            </span>
          </div>

          <div className="flex-1 w-full min-h-[260px]">
            {loading ? (
              <div className="h-full flex items-center justify-center text-[11px] text-[var(--text-secondary)] italic font-sans">
                Compiling run sequence...
              </div>
            ) : timeline.length === 0 ? (
              <div className="h-full flex items-center justify-center text-[11px] text-[var(--text-secondary)] italic font-sans">
                No timeline logs for chosen filters.
              </div>
            ) : (
              <ReactECharts option={getTrendOption()} style={{ height: "100%", width: "100%" }} />
            )}
          </div>
        </div>

        {/* Col 2: Top Losses Pareto Table */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-[var(--card-shadow)] flex flex-col justify-between min-h-[360px]">
          <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2.5 mb-3 flex-shrink-0">
            <div className="flex items-center gap-2 font-sans">
              <AlertTriangle className="w-4 h-4 text-rose-500" />
              <h2 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider">Top Losses (Downtime & Stoppages)</h2>
            </div>
            <span className="text-[8px] bg-rose-500/15 text-rose-500 font-bold px-1.5 py-0.5 rounded border border-rose-500/20 font-sans">
              Pareto order
            </span>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[260px] font-sans text-[10px]">
            <table className="w-full text-left border-collapse table-fixed">
              <thead>
                <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
                  <th className="py-2 pl-1 w-[40px]">Rank</th>
                  <th className="py-2 w-[160px]">Category</th>
                  <th className="py-2 text-right w-[60px]">Duration</th>
                  <th className="py-2 text-right w-[50px]">Events</th>
                  <th className="py-2 text-right pr-1 w-[60px]">% PPT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-color)]/30 text-[var(--text-primary)]">
                {pareto.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-[var(--text-secondary)] italic">
                      No losses recorded in this range.
                    </td>
                  </tr>
                ) : (
                  pareto.map((item, idx) => {
                    const percentPPT = ((item.minutes / ppt) * 100).toFixed(1);
                    
                    // Specific pill colors for ranks
                    const rankBadge = idx === 0 
                      ? "bg-rose-500 text-white font-extrabold animate-pulse" 
                      : idx === 1 
                      ? "bg-amber-500 text-white font-bold" 
                      : "bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-secondary)]";

                    return (
                      <tr key={item.code} className="hover:bg-[var(--hover-bg)]/10 transition-colors">
                        <td className="py-2.5 pl-1">
                          <span className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[9px] font-mono ${rankBadge}`}>
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-2.5 font-bold truncate pr-1 font-sans" title={item.name}>
                          <span className="text-[8.5px] bg-[var(--bg-input)] px-1 py-0.5 rounded border border-[var(--border-color)] text-[var(--text-secondary)] mr-1 font-sans">
                            {item.code}
                          </span>
                          {item.name}
                        </td>
                        <td className="py-2.5 text-right font-extrabold text-[var(--text-primary)] font-mono truncate">{item.minutes.toFixed(1)}m</td>
                        <td className="py-2.5 text-right font-semibold text-[var(--text-secondary)] font-mono truncate">{item.count}&times;</td>
                        <td className="py-2.5 text-right pr-1 font-bold text-rose-500 font-mono truncate">{percentPPT}%</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Col 3: Unified Telemetry Summary Audit Card */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-[var(--card-shadow)] flex flex-col justify-between min-h-[360px]">
          
          <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2.5 mb-3 flex-shrink-0">
            <div className="flex items-center gap-2 font-sans">
              <ActivitySquare className="w-4 h-4 text-[var(--primary-brand)]" />
              <h2 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider font-sans">Production & Time Audit</h2>
            </div>
            <span className="text-[8px] bg-[var(--primary-brand)]/15 text-[var(--primary-brand)] font-bold px-1.5 py-0.5 rounded border border-[var(--primary-brand)]/20 font-sans">
              Live audit
            </span>
          </div>

          <div className="flex-1 flex flex-col gap-3 font-sans text-[10px] justify-around">
            
            {/* 1. Time Allocation Block */}
            <div className="flex flex-col gap-1.5 border-b border-[var(--border-color)]/30 pb-2">
              <span className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-wider block font-sans">Time Allocation Share</span>
              
              {/* Dynamic Flex Allocation Bar */}
              <div className="w-full h-4 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg overflow-hidden flex text-[8px] text-white">
                {netPct > 0 && (
                  <div 
                    className="bg-[#5ebd56] h-full flex items-center justify-center font-extrabold truncate font-sans" 
                    style={{ width: `${netPct}%` }}
                    title={`Net Operating: ${netOperating.toFixed(1)} min`}
                  >
                    {netPct > 15 && "NET"}
                  </div>
                )}
                {perfPct > 0 && (
                  <div 
                    className="bg-[#fed130] h-full flex items-center justify-center font-extrabold text-zinc-900 truncate font-sans" 
                    style={{ width: `${perfPct}%` }}
                    title={`Performance Loss: ${perfLoss.toFixed(1)} min`}
                  >
                    {perfPct > 15 && "LOSS"}
                  </div>
                )}
                {downtimePct > 0 && (
                  <div 
                    className="bg-[#e05e52] h-full flex items-center justify-center font-extrabold truncate animate-pulse font-sans" 
                    style={{ width: `${downtimePct}%` }}
                    title={`Downtime: ${downtime.toFixed(1)} min`}
                  >
                    {downtimePct > 15 && "DOWN"}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-y-1 mt-1 font-sans">
                <div className="flex justify-between items-center pr-2 border-r border-[var(--border-color)]/30 truncate">
                  <span className="text-[8.5px] text-[var(--text-secondary)]">PPT Load:</span>
                  <span className="font-extrabold text-[var(--text-primary)] font-mono">{summary.loadingTime}m</span>
                </div>
                <div className="flex justify-between items-center pl-2 truncate">
                  <span className="text-[8.5px] text-[#5ebd56] font-bold">Operating:</span>
                  <span className="font-extrabold text-[#5ebd56] font-mono">{summary.operatingTime}m</span>
                </div>
                <div className="flex justify-between items-center pr-2 border-r border-[var(--border-color)]/30 mt-0.5 truncate">
                  <span className="text-[8.5px] text-indigo-500 font-bold">Net Oper:</span>
                  <span className="font-extrabold text-indigo-500 font-mono">{summary.netOperatingTime.toFixed(1)}m</span>
                </div>
                <div className="flex justify-between items-center pl-2 mt-0.5 truncate">
                  <span className="text-[8.5px] text-rose-500 font-bold">Downtime:</span>
                  <span className="font-extrabold text-rose-500 font-mono">{downtime.toFixed(1)}m</span>
                </div>
              </div>
            </div>

            {/* 2. Output & Quality Yield Block */}
            <div className="flex flex-col gap-1 border-b border-[var(--border-color)]/30 pb-2">
              <span className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-wider block font-sans">Production Yield Rates</span>
              <div className="space-y-1">
                <div className="flex justify-between items-center truncate">
                  <span className="text-[8.5px] text-[var(--text-secondary)]">Standard Speed:</span>
                  <span className="font-extrabold text-[var(--text-primary)] font-mono">{summary.standarSpeed || 1} pcs/m</span>
                </div>
                <div className="flex justify-between items-center truncate">
                  <span className="text-[8.5px] text-[var(--text-secondary)]">Total Output Count:</span>
                  <span className="font-extrabold text-[var(--text-primary)] font-mono">{(summary.totalOutput || 0).toLocaleString("en-US")} pcs</span>
                </div>
                <div className="flex justify-between items-center truncate">
                  <span className="text-[8.5px] text-rose-500">Defect Rejects:</span>
                  <span className="font-extrabold text-rose-500 font-mono">{(summary.rework + summary.reject).toLocaleString("en-US")} pcs</span>
                </div>
                <div className="flex justify-between items-center truncate">
                  <span className="text-[8.5px] text-emerald-500">Quality Yield Rate (Q):</span>
                  <span className="font-extrabold text-emerald-500 font-mono">{summary.quality}%</span>
                </div>
              </div>
            </div>

            {/* 3. Connection & Machine Status Block */}
            <div className="flex items-center justify-between gap-4 pt-1">
              <div className="truncate flex-1">
                <span className="text-[9px] text-[var(--text-secondary)] font-bold uppercase tracking-wider block">Telemetry Station</span>
                <span className="font-extrabold text-[var(--text-primary)] text-xs block truncate mt-0.5" title={getLinkedMachineName()}>
                  {getLinkedMachineName()}
                </span>
              </div>
              <div className="text-right flex flex-col items-end gap-1 flex-shrink-0">
                <span className="text-[8px] text-[var(--text-secondary)] uppercase font-bold tracking-wider">Device Mode</span>
                {summary.oee > 0 ? (
                  <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-500 px-2 py-0.5 border border-emerald-500/20 rounded font-black text-[9px] uppercase tracking-widest animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span>Running</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 bg-amber-500/10 text-amber-500 px-2 py-0.5 border border-amber-500/20 rounded font-black text-[9px] uppercase tracking-widest">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    <span>Idle/Stop</span>
                  </span>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
