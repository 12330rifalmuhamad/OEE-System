"use client";

import React, { useState, useEffect } from "react";
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
  MoreHorizontal,
  Filter,
  X,
  Settings,
} from "lucide-react";
import Link from "next/link";

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
}

interface TimelineItem {
  okpNumber: string;
  date: string;
  oee: number;
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
  });
  const [pareto, setPareto] = useState<ParetoItem[]>([]);
  const [machines, setMachines] = useState<MachineOee[]>([]);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filterType, setFilterType] = useState<"all" | "day" | "okp">("all");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedOkp, setSelectedOkp] = useState("");
  const [okpList, setOkpList] = useState<any[]>([]);

  // Custom Dashboard Tab & Configuration
  const [activeTab, setActiveTab] = useState<"oee" | "custom">("oee");
  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [customWidgets, setCustomWidgets] = useState<{
    oeeGauge: boolean;
    machineMatrix: boolean;
    formulaValidation: boolean;
    paretoDowntime: boolean;
    oeeTrend: boolean;
  }>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("customWidgets");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) { }
      }
    }
    return {
      oeeGauge: true,
      machineMatrix: true,
      formulaValidation: true,
      paretoDowntime: true,
      oeeTrend: true,
    };
  });

  useEffect(() => {
    localStorage.setItem("customWidgets", JSON.stringify(customWidgets));
  }, [customWidgets]);

  const fetchAnalytics = async (
    type = filterType,
    date = selectedDate,
    okp = selectedOkp
  ) => {
    setLoading(true);
    setError("");
    try {
      let url = "/api/analytics/oee";
      const params = [];
      if (type === "day" && date) {
        params.push(`date=${date}`);
      } else if (type === "okp" && okp) {
        params.push(`okp=${okp}`);
      }

      if (params.length > 0) url += `?${params.join("&")}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setPareto(data.pareto);
        setMachines(data.machineOee);
        setTimeline(data.timeline);
      } else {
        setError("Gagal memuat analitik OEE.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server analitik.");
    } finally {
      setLoading(false);
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

  useEffect(() => {
    fetchAnalytics(filterType, selectedDate, selectedOkp);
    fetchOkps();

    const interval = setInterval(() => {
      // Fetch in background quietly
      fetchAnalytics(filterType, selectedDate, selectedOkp);
    }, 3000);

    return () => clearInterval(interval);
  }, [filterType, selectedDate, selectedOkp]);

  // Soft indicator colors matching the screenshot
  const getAvailabilityColor = (val: number) => "text-[#5ebd56]";
  const getPerformanceColor = (val: number) => "text-[#fed130]";
  const getQualityColor = (val: number) => "text-[#f2a134]";

  const getOeeColor = (val: number) => {
    if (val >= 85) return "text-[#5ebd56]";
    if (val >= 70) return "text-[#fed130]";
    return "text-rose-400";
  };

  // Replicating color coded Pareto bars from the screenshot
  const getParetoBarColor = (index: number) => {
    const colors = [
      "from-[#e05e52] to-[#e05e52]", // Coral Red (Uncommented/Critical)
      "from-[#ffd54f] to-[#ffd54f]", // Yellow (Break)
      "from-[#4db6ac] to-[#4db6ac]", // Teal (No Planned Prod)
      "from-[#42a5f5] to-[#42a5f5]", // Blue (Setup)
      "from-[#00897b] to-[#00897b]", // Dark Teal
      "from-[#a1887f] to-[#a1887f]", // Soft Brown
      "from-[#ff7043] to-[#ff7043]", // Orange
    ];
    return colors[index % colors.length];
  };

  const getParetoArrowColor = (index: number) => {
    const textColors = [
      "text-[#e05e52]",
      "text-[#ffd54f]",
      "text-[#4db6ac]",
      "text-[#42a5f5]",
      "text-[#00897b]",
      "text-[#a1887f]",
      "text-[#ff7043]",
    ];
    return textColors[index % textColors.length];
  };

  // Pareto total lost minutes
  const totalLostMinutes = pareto.reduce((sum, item) => sum + item.minutes, 0);

  // Dynamic layout metrics for OEE Concentric Gauge when rendering single
  const isSingleGauge = activeTab === "custom" && customWidgets.oeeGauge && !customWidgets.machineMatrix;

  // Dynamic geometry
  const cx = isSingleGauge ? 128 : 80;
  const cy = isSingleGauge ? 128 : 80;
  const strokeW = isSingleGauge ? 12 : 7.5;
  const r1 = isSingleGauge ? 106 : 66; // Availability
  const r2 = isSingleGauge ? 80 : 50;  // Performance
  const r3 = isSingleGauge ? 54 : 34;  // Quality

  const c1 = 2 * Math.PI * r1;
  const c2 = 2 * Math.PI * r2;
  const c3 = 2 * Math.PI * r3;

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full relative z-10 bg-[var(--bg-base)] transition-colors duration-200">

      {/* 1. SCADA-STYLE HEADER & NAVIGATION TABS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[var(--border-color)] pb-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[var(--text-primary)] tracking-wider uppercase font-mono flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-[#5ebd56]" />
              <span>Telemetry Hub</span>
            </h2>
          </div>

          {/* Active Navigation Tabs from Screenshot */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold font-mono">
            <button
              onClick={() => setActiveTab("oee")}
              className={`pb-3 px-1 transition-all cursor-pointer font-bold border-b-2 ${activeTab === "oee"
                ? "border-[#5ebd56] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
            >
              OEE & Downtime
            </button>
            <button
              onClick={() => setActiveTab("custom")}
              className={`pb-3 px-1 transition-all cursor-pointer font-bold border-b-2 ${activeTab === "custom"
                ? "border-[#5ebd56] text-[var(--text-primary)]"
                : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
            >
              My Dashboard
            </button>
            <button
              onClick={() => setIsCustomizeModalOpen(true)}
              className="text-[var(--text-secondary)] pb-3 hover:text-[#5ebd56] transition-all font-bold text-sm px-1 cursor-pointer"
              title="Kustomisasi Dashboard"
            >
              +
            </button>
          </div>
        </div>

        {/* Sleek, Premium Filter Panel */}
        <div className="flex flex-wrap items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] p-2 rounded-xl text-xs shadow-[var(--card-shadow)]">
          {/* Mode Selector Tabs */}
          <div className="flex items-center bg-[var(--bg-input)] border border-[var(--border-color)] p-1 rounded-lg">
            <button
              onClick={() => {
                setFilterType("all");
                setSelectedDate("");
                setSelectedOkp("");
              }}
              className={`px-3 py-1.5 rounded-md font-bold transition-all text-[10px] uppercase tracking-wider font-mono cursor-pointer ${filterType === "all"
                ? "bg-[#5ebd56] text-black"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
            >
              All
            </button>
            <button
              onClick={() => {
                setFilterType("day");
                setSelectedOkp("");
                // Set default to today's date if empty
                if (!selectedDate) {
                  const today = new Date().toISOString().split("T")[0];
                  setSelectedDate(today);
                }
              }}
              className={`px-3 py-1.5 rounded-md font-bold transition-all text-[10px] uppercase tracking-wider font-mono cursor-pointer ${filterType === "day"
                ? "bg-[#5ebd56] text-black"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
            >
              By Day
            </button>
            <button
              onClick={() => {
                setFilterType("okp");
                setSelectedDate("");
                // Set default to first OKP if available
                if (!selectedOkp && okpList.length > 0) {
                  setSelectedOkp(okpList[0].okpNumber);
                }
              }}
              className={`px-3 py-1.5 rounded-md font-bold transition-all text-[10px] uppercase tracking-wider font-mono cursor-pointer ${filterType === "okp"
                ? "bg-[#5ebd56] text-black"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
            >
              By OKP
            </button>
          </div>

          {/* Dynamic Filter Input Field */}
          {filterType === "day" && (
            <div className="flex items-center gap-2 animate-fadeIn">
              <Calendar className="w-4 h-4 text-[#5ebd56]" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-[var(--bg-input)] border border-[var(--border-color)] px-2.5 py-1.5 rounded-lg text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[#5ebd56] transition-colors"
              />
            </div>
          )}

          {filterType === "okp" && (
            <div className="flex items-center gap-2 animate-fadeIn w-full sm:w-auto">
              <Filter className="w-4 h-4 text-[#5ebd56]" />
              <select
                value={selectedOkp}
                onChange={(e) => setSelectedOkp(e.target.value)}
                className="bg-[var(--bg-input)] border border-[var(--border-color)] px-3 py-1.5 rounded-lg text-xs text-[var(--text-primary)] font-mono focus:outline-none focus:border-[#5ebd56] transition-colors cursor-pointer max-w-[200px]"
              >
                <option value="" disabled className="bg-[var(--bg-card)] text-[var(--text-primary)]">Pilih OKP...</option>
                {okpList.map((okp) => (
                  <option key={okp.id} value={okp.okpNumber} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                    {okp.okpNumber} ({okp.product.name.substring(0, 15)}...)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Refresh/Reset Button */}
          <button
            onClick={() => {
              setFilterType("all");
              setSelectedDate("");
              setSelectedOkp("");
            }}
            className="p-2 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[#5ebd56] hover:border-[#5ebd56]/30 rounded-lg transition-all cursor-pointer flex items-center justify-center"
            title="Reset Filters"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-550/10 border border-rose-500/20 text-rose-500 p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* 2. DUAL CARD GRID: CONCENTRIC RADIALS & CAPABILITY */}
      {(activeTab === "oee" || customWidgets.oeeGauge || customWidgets.machineMatrix) && (
        <div className={`grid grid-cols-1 ${activeTab === "custom" && [customWidgets.oeeGauge, customWidgets.machineMatrix].filter(Boolean).length === 1 ? "" : "lg:grid-cols-2"} gap-6`}>

          {/* Concentric radial ring card (MATCHING SCREENSHOT PERFECTLY) */}
          {(activeTab === "oee" || customWidgets.oeeGauge) && (
            <div className={`bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 flex flex-col justify-between relative overflow-hidden shadow-[var(--card-shadow)] ${isSingleGauge ? "min-h-[380px]" : "min-h-[280px]"} transition-all`}>
              <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2">
                <div>
                  <h3 className={`font-bold text-[var(--text-primary)] uppercase tracking-widest font-mono flex items-center gap-1.5 ${isSingleGauge ? "text-sm lg:text-base" : "text-xs"}`}>
                    OEE <span className="text-[var(--text-secondary)] font-normal lowercase">This shift</span>
                  </h3>
                  <p className={`text-[var(--text-secondary)] mt-0.5 font-mono ${isSingleGauge ? "text-xs" : "text-[10px]"}`}>FBF 1, FBF 2, FBF 3, FBF 4, FBF 5, FBF 6</p>
                </div>
                <MoreHorizontal className="w-4 h-4 text-[var(--text-secondary)] cursor-pointer" />
              </div>

              <div className={`flex flex-row items-center justify-around my-4 gap-4 ${isSingleGauge ? "py-6" : ""}`}>
                {/* Left aligned values with +/- percentage indicators */}
                <div className={`flex flex-col font-mono ${isSingleGauge ? "gap-6 scale-110 lg:scale-125 origin-left" : "gap-4"}`}>
                  <div className="flex flex-col">
                    <span className={`text-[var(--text-secondary)] uppercase tracking-wider ${isSingleGauge ? "text-[10px] lg:text-xs" : "text-[9px]"}`}>Availability</span>
                    <span className={`font-extrabold text-[#5ebd56] ${isSingleGauge ? "text-3xl lg:text-4xl" : "text-base"}`}>{summary.availability}%</span>
                    <span className={`text-rose-500 font-semibold ${isSingleGauge ? "text-xs lg:text-sm" : "text-[9px]"}`}>-18%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[var(--text-secondary)] uppercase tracking-wider ${isSingleGauge ? "text-[10px] lg:text-xs" : "text-[9px]"}`}>Performance</span>
                    <span className={`font-extrabold text-[#fed130] ${isSingleGauge ? "text-3xl lg:text-4xl" : "text-base"}`}>{summary.performance}%</span>
                    <span className={`text-[#5ebd56] font-semibold ${isSingleGauge ? "text-xs lg:text-sm" : "text-[9px]"}`}>+1%</span>
                  </div>
                  <div className="flex flex-col">
                    <span className={`text-[var(--text-secondary)] uppercase tracking-wider ${isSingleGauge ? "text-[10px] lg:text-xs" : "text-[9px]"}`}>Quality</span>
                    <span className={`font-extrabold text-[#f2a134] ${isSingleGauge ? "text-3xl lg:text-4xl" : "text-base"}`}>{summary.quality}%</span>
                    <span className={`text-[var(--text-secondary)] font-semibold ${isSingleGauge ? "text-xs lg:text-sm" : "text-[9px]"}`}>+0%</span>
                  </div>
                </div>

                {/* Right: Nested Concentric Gauge Rings */}
                <div className={`relative ${isSingleGauge ? "w-56 h-56 lg:w-64 lg:h-64" : "w-40 h-40"} flex items-center justify-center`}>
                  <svg className="w-full h-full transform -rotate-90" viewBox={`0 0 ${isSingleGauge ? 256 : 160} ${isSingleGauge ? 256 : 160}`}>
                    {/* 1. Outer Ring: Availability */}
                    <circle cx={cx} cy={cy} r={r1} stroke="var(--ring-bg)" strokeWidth={strokeW} fill="transparent" />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r1}
                      className="stroke-[#5ebd56] transition-all duration-1000 ease-out"
                      strokeWidth={strokeW}
                      fill="transparent"
                      strokeDasharray={c1}
                      strokeDashoffset={c1 - (c1 * summary.availability) / 100}
                      strokeLinecap="round"
                    />

                    {/* 2. Middle Ring: Performance */}
                    <circle cx={cx} cy={cy} r={r2} stroke="var(--ring-bg)" strokeWidth={strokeW} fill="transparent" />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r2}
                      className="stroke-[#fed130] transition-all duration-1000 ease-out"
                      strokeWidth={strokeW}
                      fill="transparent"
                      strokeDasharray={c2}
                      strokeDashoffset={c2 - (c2 * summary.performance) / 100}
                      strokeLinecap="round"
                    />

                    {/* 3. Inner Ring: Quality */}
                    <circle cx={cx} cy={cy} r={r3} stroke="var(--ring-bg)" strokeWidth={strokeW} fill="transparent" />
                    <circle
                      cx={cx}
                      cy={cy}
                      r={r3}
                      className="stroke-[#f2a134] transition-all duration-1000 ease-out"
                      strokeWidth={strokeW}
                      fill="transparent"
                      strokeDasharray={c3}
                      strokeDashoffset={c3 - (c3 * summary.quality) / 100}
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* Centered OEE Text in nested circles */}
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className={`font-extrabold font-mono text-[var(--text-primary)] tracking-tighter ${isSingleGauge ? "text-4xl lg:text-5xl" : "text-2xl"}`}>{summary.oee}%</span>
                    <span className={`text-[var(--text-secondary)] font-bold tracking-widest uppercase font-mono mt-0.5 ${isSingleGauge ? "text-[10px] lg:text-xs" : "text-[8px]"}`}>OEE</span>
                  </div>
                </div>
              </div>

              <div className={`flex justify-between items-center text-[var(--text-secondary)] border-t border-[var(--border-color)] pt-2 ${isSingleGauge ? "text-xs py-2" : "text-[9px]"}`}>
                <span>Overall capability: <span className="text-[#5ebd56] font-semibold">Operational</span></span>
                <span>Target: <span className="text-[#5ebd56] font-semibold font-mono">85.0%</span></span>
              </div>
            </div>
          )}

          {/* Machine Capability Matrix (Right Side Card) */}
          {(activeTab === "oee" || customWidgets.machineMatrix) && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-[var(--card-shadow)] min-h-[280px] flex flex-col justify-between transition-all">
              <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2">
                <div>
                  <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest font-mono">Line Machine Matrix</h3>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-mono">Active plant capabilities.</p>
                </div>
                <MoreHorizontal className="w-4 h-4 text-[var(--text-secondary)] cursor-pointer" />
              </div>

              <div className="overflow-x-auto my-3 flex-1">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider font-mono">
                      <th className="py-2">Line</th>
                      <th className="py-2 text-right font-mono">AR</th>
                      <th className="py-2 text-right font-mono">PR</th>
                      <th className="py-2 text-right font-mono">QR</th>
                      <th className="py-2 text-right font-mono">OEE</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)]">
                    {loading ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[var(--text-secondary)] italic font-mono">
                          Fetching line parameters...
                        </td>
                      </tr>
                    ) : machines.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-[var(--text-secondary)] italic font-mono">
                          No machinery registered.
                        </td>
                      </tr>
                    ) : (
                      machines.map((m) => (
                        <tr key={m.id} className="hover:bg-[var(--hover-bg)]/20 transition-colors">
                          <td className="py-2.5 font-semibold text-[var(--text-primary)] flex items-center gap-2 font-mono">
                            <Cpu className="w-3.5 h-3.5 text-[#5ebd56]" />
                            {m.name}
                          </td>
                          <td className="py-2.5 text-right font-mono text-[#5ebd56]">{m.availability}%</td>
                          <td className="py-2.5 text-right font-mono text-[#fed130]">{m.performance}%</td>
                          <td className="py-2.5 text-right font-mono text-[#f2a134]">{m.quality}%</td>
                          <td className={`py-2.5 text-right font-mono font-extrabold ${getOeeColor(m.oee)}`}>
                            {m.oee}%
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. SPREADSHEET FORMULA VALIDATION PANEL */}
      {(activeTab === "oee" || customWidgets.formulaValidation) && (
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-[var(--card-shadow)] transition-all">
          <div className="border-b border-[var(--border-color)] pb-2 mb-4">
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest font-mono flex items-center gap-2">
              <Calculator className="w-4.5 h-4.5 text-[#5ebd56]" />
              <span>Master Formula Telemetry Validation</span>
            </h3>
          </div>

          {/* 6-Step Visual Timeline of Time Allocations */}
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4 font-mono">
            <div className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-3">
              <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Loading Time</span>
              <div className="text-sm font-bold text-[var(--text-primary)] mt-1">{summary.loadingTime} <span className="text-[10px] text-[var(--text-secondary)]">min</span></div>
              <p className="text-[9px] text-[var(--text-secondary)] mt-1.5 leading-normal">Total Shift Time</p>
            </div>

            <div className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-3">
              <span className="text-[9px] font-bold text-[#5ebd56] uppercase tracking-wider">Operating Time</span>
              <div className="text-sm font-bold text-[#5ebd56] mt-1">{summary.operatingTime} <span className="text-[10px] text-[var(--text-secondary)]">min</span></div>
              <p className="text-[9px] text-[var(--text-secondary)] mt-1.5 leading-normal">Loading - Down - MI</p>
            </div>

            <div className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-3">
              <span className="text-[9px] font-bold text-rose-450 uppercase tracking-wider">Performance Loss</span>
              <div className="text-sm font-bold text-rose-500 mt-1">{summary.performanceLoss} <span className="text-[10px] text-[var(--text-secondary)]">min</span></div>
              <p className="text-[9px] text-[var(--text-secondary)] mt-1.5 leading-normal">Cycle Deficit</p>
            </div>

            <div className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-3">
              <span className="text-[9px] font-bold text-[var(--text-primary)] uppercase tracking-wider">Net Operating</span>
              <div className="text-sm font-bold text-[var(--text-primary)] mt-1">{summary.netOperatingTime} <span className="text-[10px] text-[var(--text-secondary)]">min</span></div>
              <p className="text-[9px] text-[var(--text-secondary)] mt-1.5 leading-normal">Output / Std Speed</p>
            </div>

            <div className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-3">
              <span className="text-[9px] font-bold text-[#fed130] uppercase tracking-wider">Defect Loss</span>
              <div className="text-sm font-bold text-[#fed130] mt-1">{summary.defectLoss} <span className="text-[10px] text-[var(--text-secondary)]">min</span></div>
              <p className="text-[9px] text-[var(--text-secondary)] mt-1.5 leading-normal">(Reject)/Speed</p>
            </div>

            <div className="bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg p-3">
              <span className="text-[9px] font-bold text-[#f2a134] uppercase tracking-wider">Valued Operating</span>
              <div className="text-sm font-bold text-[#f2a134] mt-1">{summary.valuedOperatingTime} <span className="text-[10px] text-[var(--text-secondary)]">min</span></div>
              <p className="text-[9px] text-[var(--text-secondary)] mt-1.5 leading-normal">Net - Defect Time</p>
            </div>
          </div>
        </div>
      )}

      {/* 4. DUAL COLUMN PARETO DOWNTIME & TRENDS */}
      {(activeTab === "oee" || customWidgets.paretoDowntime || customWidgets.oeeTrend) && (
        <div className={`grid grid-cols-1 ${activeTab === "custom" && [customWidgets.paretoDowntime, customWidgets.oeeTrend].filter(Boolean).length === 1 ? "" : "lg:grid-cols-2"} gap-6`}>

          {/* Pareto Downtime chart - 100% Matching Screenshot Colors and Arrows */}
          {(activeTab === "oee" || customWidgets.paretoDowntime) && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-[var(--card-shadow)] flex flex-col justify-between min-h-[300px] transition-all">
              <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2">
                <div>
                  <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest font-mono">Downtime Pareto Chart (Lost Time)</h3>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-mono">Total minutes categorized precisely by Pareto ranks.</p>
                </div>
                <MoreHorizontal className="w-4 h-4 text-[var(--text-secondary)] cursor-pointer" />
              </div>

              <div className="flex-1 flex flex-col gap-3.5 justify-center font-mono my-4">
                {loading ? (
                  <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)] text-xs italic">
                    Loading downtime logs...
                  </div>
                ) : pareto.length === 0 ? (
                  <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)] text-xs italic">
                    No recorded downtime.
                  </div>
                ) : (
                  pareto.map((item, index) => {
                    const percentOfTotal = totalLostMinutes > 0 ? (item.minutes / totalLostMinutes) * 100 : 0;
                    return (
                      <div key={item.code} className="flex flex-col gap-1 font-mono">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-[var(--text-primary)]">
                            [{item.code.toUpperCase()}] {item.name}
                          </span>
                          <span className="font-bold text-[var(--text-primary)]">
                            {item.minutes}m <span className="text-[10px] text-[var(--text-secondary)] font-medium">({percentOfTotal.toFixed(1)}%)</span>
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-[var(--bg-input)] h-3.5 rounded-md overflow-hidden border border-[var(--border-color)]">
                            <div
                              className={`bg-gradient-to-r ${getParetoBarColor(index)} h-full rounded-md transition-all duration-1000`}
                              style={{ width: `${percentOfTotal}%` }}
                            />
                          </div>

                          {/* Left/Right Directional indicator triangle from Screenshot */}
                          <span className={`text-[10px] font-bold ${getParetoArrowColor(index)}`}>
                            {index % 2 === 0 ? "◀" : "▶"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* OKP OEE Trend Analysis */}
          {(activeTab === "oee" || customWidgets.oeeTrend) && (
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-[var(--card-shadow)] flex flex-col justify-between min-h-[300px] transition-all">
              <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-2">
                <div>
                  <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest font-mono">OKP OEE Trend Logs</h3>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-0.5 font-mono">Historical sequence of recent production runs.</p>
                </div>
                <Link
                  href="/dashboard/transactions"
                  className="flex items-center gap-1 text-xs text-[#5ebd56] hover:text-[#53a74c] font-semibold transition-colors"
                >
                  OKP History
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Sequential horizontal timeline steps */}
              <div className="flex items-center gap-4 overflow-x-auto py-6 pl-2 scrollbar-thin flex-1 my-auto font-mono">
                {loading ? (
                  <div className="text-[var(--text-secondary)] text-xs italic font-mono">Mapping trend...</div>
                ) : timeline.length === 0 ? (
                  <div className="text-[var(--text-secondary)] text-xs italic font-mono">No historical trend logs.</div>
                ) : (
                  timeline.map((item, idx) => (
                    <div key={idx} className="flex items-center flex-shrink-0 gap-3 group">
                      <div className="flex flex-col items-center gap-1.5">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-xs border font-mono ${item.oee >= 85
                            ? "text-[#5ebd56] border-[#5ebd56]/20 bg-[#5ebd56]/5"
                            : "text-[#fed130] border-[#fed130]/20 bg-[#fed130]/5"
                            }`}
                        >
                          {item.oee}%
                        </div>
                        <span className="font-mono text-[9px] font-bold text-[var(--text-primary)] mt-1">{item.okpNumber}</span>
                        <span className="text-[8px] text-[var(--text-secondary)]">{item.date}</span>
                      </div>
                      {idx < timeline.length - 1 && <div className="w-8 h-[1px] bg-[var(--border-color)]" />}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. CUSTOM DASHBOARD EMPTY STATE */}
      {activeTab === "custom" && Object.values(customWidgets).every((val) => !val) && (
        <div className="bg-[var(--bg-card)] border border-dashed border-[var(--border-color)] rounded-xl p-12 flex flex-col items-center justify-center text-center max-w-md mx-auto my-8 shadow-md">
          <div className="w-12 h-12 rounded-full bg-[var(--bg-input)] border border-[var(--border-color)] flex items-center justify-center text-[#5ebd56] text-xl font-extrabold mb-4 select-none">
            +
          </div>
          <h3 className="text-xs font-bold text-[var(--text-primary)] font-mono uppercase tracking-wider">Dashboard Kustom Kosong</h3>
          <p className="text-[10px] text-[var(--text-secondary)] mt-2 leading-relaxed font-mono">
            Anda belum mengaktifkan widget apa pun di halaman "My Dashboard". Tekan tombol di bawah atau tombol "+" di atas untuk memilih metrik visualisasi pabrik Anda.
          </p>
          <button
            onClick={() => setIsCustomizeModalOpen(true)}
            className="mt-6 px-4 py-2 bg-[#5ebd56] hover:bg-[#53a74c] text-black font-extrabold rounded-lg text-[10px] transition-colors cursor-pointer uppercase font-mono tracking-widest"
          >
            Pilih Widget
          </button>
        </div>
      )}

      {/* 6. MODAL: KUSTOMISASI DASHBOARD */}
      {isCustomizeModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl max-w-md w-full overflow-hidden shadow-2xl relative">
            <div className="flex justify-between items-center p-4 border-b border-[var(--border-color)] bg-[var(--bg-input)]">
              <h3 className="font-bold text-xs uppercase tracking-wider text-[var(--text-primary)] font-mono flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#5ebd56]" />
                Kustomisasi Widget Dashboard
              </h3>
              <button
                onClick={() => setIsCustomizeModalOpen(false)}
                className="p-1 hover:bg-zinc-800 rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs font-mono">
              <p className="text-[10px] text-[var(--text-secondary)] leading-normal mb-2">
                Pilih widget analitik yang ingin Anda tampilkan pada halaman tab <strong>"My Dashboard"</strong> Anda secara real-time.
              </p>

              <div className="space-y-3">
                {/* Widget 1: OEE Gauge */}
                <label className="flex items-start gap-3 p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg cursor-pointer hover:border-[#5ebd56]/30 transition-all select-none">
                  <input
                    type="checkbox"
                    checked={customWidgets.oeeGauge}
                    onChange={(e) =>
                      setCustomWidgets((prev) => ({
                        ...prev,
                        oeeGauge: e.target.checked,
                      }))
                    }
                    className="mt-0.5 accent-[#5ebd56] cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-[var(--text-primary)] block text-[10px] uppercase tracking-wider">Concentric OEE Gauge</span>
                    <span className="text-[9px] text-[var(--text-secondary)] leading-normal block mt-1">
                      Grafik lingkaran berlapis untuk Availability, Performance, dan Quality.
                    </span>
                  </div>
                </label>

                {/* Widget 2: Line Machine Matrix */}
                <label className="flex items-start gap-3 p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg cursor-pointer hover:border-[#5ebd56]/30 transition-all select-none">
                  <input
                    type="checkbox"
                    checked={customWidgets.machineMatrix}
                    onChange={(e) =>
                      setCustomWidgets((prev) => ({
                        ...prev,
                        machineMatrix: e.target.checked,
                      }))
                    }
                    className="mt-0.5 accent-[#5ebd56] cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-[var(--text-primary)] block text-[10px] uppercase tracking-wider">Line Machine Matrix</span>
                    <span className="text-[9px] text-[var(--text-secondary)] leading-normal block mt-1">
                      Tabel kinerja real-time yang memuat data OEE untuk setiap mesin pabrik.
                    </span>
                  </div>
                </label>

                {/* Widget 3: Telemetry Validation */}
                <label className="flex items-start gap-3 p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg cursor-pointer hover:border-[#5ebd56]/30 transition-all select-none">
                  <input
                    type="checkbox"
                    checked={customWidgets.formulaValidation}
                    onChange={(e) =>
                      setCustomWidgets((prev) => ({
                        ...prev,
                        formulaValidation: e.target.checked,
                      }))
                    }
                    className="mt-0.5 accent-[#5ebd56] cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-[var(--text-primary)] block text-[10px] uppercase tracking-wider">Formula Telemetry Validation</span>
                    <span className="text-[9px] text-[var(--text-secondary)] leading-normal block mt-1">
                      Detail alokasi waktu operasional (Loading, Operating, Net Operating, Defect, dll).
                    </span>
                  </div>
                </label>

                {/* Widget 4: Pareto lost time */}
                <label className="flex items-start gap-3 p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg cursor-pointer hover:border-[#5ebd56]/30 transition-all select-none">
                  <input
                    type="checkbox"
                    checked={customWidgets.paretoDowntime}
                    onChange={(e) =>
                      setCustomWidgets((prev) => ({
                        ...prev,
                        paretoDowntime: e.target.checked,
                      }))
                    }
                    className="mt-0.5 accent-[#5ebd56] cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-[var(--text-primary)] block text-[10px] uppercase tracking-wider">Downtime Pareto Chart</span>
                    <span className="text-[9px] text-[var(--text-secondary)] leading-normal block mt-1">
                      Visualisasi peringkat losses downtime terbesar di lantai pabrik.
                    </span>
                  </div>
                </label>

                {/* Widget 5: OEE Trend */}
                <label className="flex items-start gap-3 p-3 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg cursor-pointer hover:border-[#5ebd56]/30 transition-all select-none">
                  <input
                    type="checkbox"
                    checked={customWidgets.oeeTrend}
                    onChange={(e) =>
                      setCustomWidgets((prev) => ({
                        ...prev,
                        oeeTrend: e.target.checked,
                      }))
                    }
                    className="mt-0.5 accent-[#5ebd56] cursor-pointer"
                  />
                  <div>
                    <span className="font-bold text-[var(--text-primary)] block text-[10px] uppercase tracking-wider">OKP OEE Trend Logs</span>
                    <span className="text-[9px] text-[var(--text-secondary)] leading-normal block mt-1">
                      Grafik tren historikal hasil OEE dari run produksi OKP sebelumnya.
                    </span>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 border-t border-[var(--border-color)] pt-4 mt-4 bg-[var(--bg-card)]">
                <button
                  type="button"
                  onClick={() => setIsCustomizeModalOpen(false)}
                  className="px-5 py-2.5 bg-[#5ebd56] hover:bg-[#53a74c] text-black font-extrabold rounded-lg text-[10px] uppercase tracking-widest cursor-pointer transition-colors"
                >
                  Selesai
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

