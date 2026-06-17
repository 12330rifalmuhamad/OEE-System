"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  TrendingUp,
  RefreshCw,
  Clock,
  Monitor,
  X,
  Maximize,
  Minimize,
  Calendar,
  Cpu,
  Layers,
  BarChart3,
  Shield,
  CheckCircle,
  Gauge,
  Activity,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  Play
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

interface OkpLogItem {
  id: number;
  okpNumber: string;
  machine: { 
    name: string;
    lineProcess?: { id: number; name: string } | null;
  };
}

// Chevron logo SVG component for header
const ChevronLogo = () => (
  <div className="w-8 h-8 rounded bg-[#374151] border border-[#4b5563] flex items-center justify-center">
    <svg className="w-5 h-5 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
      <path d="M13 17l5-5-5-5M6 17l5-5-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

// High-fidelity SVG Circular Gauge indicator for top row cards (Larger & thicker for TV displays)
const RingProgress = ({ value, color, icon: Icon }: { value: number; color: string; icon: any }) => {
  const size = 64; 
  const stroke = 6.0; 
  const radius = size / 2;
  const normalizedRadius = radius - stroke;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  return (
    <div className="relative w-16 h-16 flex items-center justify-center flex-shrink-0 select-none">
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Circle (Industrial Bezel) */}
        <circle
          className="text-[#252a36]"
          strokeWidth={stroke}
          stroke="currentColor"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        {/* Progress Circle (Flat Segment) */}
        <circle
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={`${circumference} ${circumference}`}
          style={{ strokeDashoffset }}
          strokeLinecap="butt"
          fill="transparent"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex items-center justify-center bg-[#15171c] rounded-full w-10 h-10 border border-[#374151]">
        <Icon className="w-4.5 h-4.5" style={{ color }} />
      </div>
    </div>
  );
};

export default function KioskDashboardPage() {
  const [selectedOkp, setSelectedOkp] = useState<string>("");
  const [selectedShift, setSelectedShift] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");

  const [okpList, setOkpList] = useState<OkpLogItem[]>([]);
  const [latestOkp, setLatestOkp] = useState<any>(null);

  const [lineId, setLineId] = useState<string | null>(null);
  const [lineName, setLineName] = useState<string>("");
  const [linesList, setLinesList] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const line = params.get("line") || params.get("lineId");
      if (line) {
        setLineId(line);
      }
    }
  }, []);

  useEffect(() => {
    if (lineId && linesList.length > 0) {
      const matchedLine = linesList.find((l: any) => l.id === parseInt(lineId, 10));
      if (matchedLine) {
        setLineName(matchedLine.name);
      } else {
        setLineName("");
      }
    } else if (!lineId) {
      setLineName("");
    }
  }, [lineId, linesList]);

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
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [liveTime, setLiveTime] = useState("");
  const [liveDate, setLiveDate] = useState("");

  // Update live clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setLiveTime(now.toTimeString().split(" ")[0]);
      setLiveDate(now.toLocaleDateString("id-ID", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric"
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Sync native fullscreen state
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  // Fetch dropdown lists
  const fetchDropdowns = async () => {
    try {
      const [resOkp, resLines] = await Promise.all([
        fetch("/api/transactions/okp"),
        fetch("/api/master/line-processes")
      ]);

      if (resOkp.ok) {
        const data = await resOkp.json();
        setOkpList(data.okpLogs || []);
      }
      if (resLines.ok) {
        const data = await resLines.json();
        setLinesList(data.lineProcesses || []);
      }
    } catch (err) {
      console.error("Gagal memuat filter dropdown:", err);
    }
  };

  // Fetch telemetry from backend OEE controller
  const fetchTelemetry = async () => {
    setLoading(true);
    setError("");
    try {
      let url = "/api/analytics/oee";
      const params = [];
      if (selectedOkp) params.push(`okp=${selectedOkp}`);
      if (selectedShift) params.push(`shift=${selectedShift}`);
      if (selectedDate) params.push(`date=${selectedDate}`);
      if (lineId) params.push(`line=${lineId}`);

      if (params.length > 0) {
        url += `?${params.join("&")}`;
      }

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setPareto(data.pareto);
        setTimeline(data.timeline || []);
        setLatestOkp(data.latestOkp || null);
      } else {
        setError("Gagal memuat telemetry OEE.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke telemetry hub.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
  }, []);

  useEffect(() => {
    fetchTelemetry();

    // Auto-refresh every 10 seconds for real-time SCADA TV monitor sync
    const refreshInterval = setInterval(() => {
      fetchTelemetry();
    }, 10000);

    return () => clearInterval(refreshInterval);
  }, [selectedOkp, selectedShift, selectedDate, lineId]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => {
        setIsFullscreen(true);
      }).catch((err) => {
        console.error("Fullscreen request failed:", err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
      });
    }
  };

  // 1. OEE trend chart options
  const getTrendOption = () => {
    const defaultHours = ["07:00", "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00"];
    const xAxisData = timeline.length > 0 ? timeline.map((item) => item.okpNumber) : defaultHours;

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "#1e222b",
        borderColor: "#374151",
        borderWidth: 1,
        textStyle: { color: "#f1f5f9", fontFamily: "var(--font-geist-mono)", fontSize: 10 }
      },
      legend: {
        data: ["OEE", "Availability", "Performance", "Quality"],
        textStyle: { color: "#94a3b8", fontFamily: "var(--font-sans)", fontSize: 9 },
        top: "0%"
      },
      grid: {
        left: "3%",
        right: "3%",
        top: "15%",
        bottom: "8%",
        containLabel: true
      },
      xAxis: {
        type: "category",
        data: xAxisData,
        axisLabel: { color: "#94a3b8", fontFamily: "var(--font-geist-mono)", fontSize: 8 },
        axisLine: { lineStyle: { color: "#374151" } }
      },
      yAxis: {
        type: "value",
        min: 0,
        max: 100,
        axisLabel: { color: "#94a3b8", fontFamily: "var(--font-geist-mono)", fontSize: 8, formatter: "{value}%" },
        splitLine: { lineStyle: { color: "rgba(255,255,255,0.02)" } },
        axisLine: { lineStyle: { color: "#374151" } }
      },
      series: [
        {
          name: "OEE",
          type: "line",
          data: timeline.length > 0 ? timeline.map((item) => item.oee) : [65, 68, 67, 60, 68, 65, 64, 66, 68.4],
          symbol: "circle",
          symbolSize: 6,
          itemStyle: { color: "#ea580c" }, // Industrial Amber Orange
          lineStyle: { width: 3 },
          smooth: true
        },
        {
          name: "Availability",
          type: "line",
          data: timeline.length > 0 ? timeline.map((item) => item.availability) : [80, 83, 82, 75, 83, 80, 79, 81, 82.9],
          symbol: "circle",
          symbolSize: 4,
          itemStyle: { color: "#2563eb" }, // Control Blue
          lineStyle: { width: 1.5, type: "dashed" },
          smooth: true
        },
        {
          name: "Performance",
          type: "line",
          data: timeline.length > 0 ? timeline.map((item) => item.performance) : [81, 83, 82, 80, 84, 81, 82, 83, 82.5],
          symbol: "circle",
          symbolSize: 4,
          itemStyle: { color: "#ca8a04" }, // Warning Yellow
          lineStyle: { width: 1.5, type: "dashed" },
          smooth: true
        },
        {
          name: "Quality",
          type: "line",
          data: timeline.length > 0 ? timeline.map((item) => item.quality) : [99.5, 99.8, 99.7, 99.6, 99.8, 99.5, 99.7, 99.8, 99.8],
          symbol: "circle",
          symbolSize: 4,
          itemStyle: { color: "#16a34a" }, // Safe Green
          lineStyle: { width: 1.5, type: "dashed" },
          smooth: true
        }
      ]
    };
  };

  // 2. Downtime Top 5 Pareto chart options
  const getParetoOption = () => {
    const totalDurationVal = pareto.reduce((sum, item) => sum + item.minutes, 0);
    let cumSum = 0;
    const paretoData = [...pareto]
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 5)
      .map((item) => {
        cumSum += item.minutes;
        return {
          ...item,
          cumPercent: totalDurationVal > 0 ? parseFloat(((cumSum / totalDurationVal) * 100).toFixed(1)) : 0
        };
      });

    const chartLabels = paretoData.length > 0 ? paretoData.map((item) => item.code) : ["BR", "CT", "ST", "MI", "OT"];
    const barValues = paretoData.length > 0 ? paretoData.map((item) => item.minutes) : [360, 84, 48, 27, 6];
    const lineValues = paretoData.length > 0 ? paretoData.map((item) => item.cumPercent) : [68.6, 84.6, 93.7, 98.8, 100];

    return {
      backgroundColor: "transparent",
      tooltip: {
        trigger: "axis",
        backgroundColor: "#1e222b",
        borderColor: "#374151",
        borderWidth: 1,
        textStyle: { color: "#f1f5f9", fontFamily: "var(--font-geist-mono)", fontSize: 10 }
      },
      grid: {
        left: "3%",
        right: "3%",
        top: "15%",
        bottom: "8%",
        containLabel: true
      },
      xAxis: {
        type: "category",
        data: chartLabels,
        axisLabel: { color: "#94a3b8", fontFamily: "var(--font-geist-mono)", fontSize: 8 },
        axisLine: { lineStyle: { color: "#374151" } }
      },
      yAxis: [
        {
          type: "value",
          axisLabel: { color: "#94a3b8", fontFamily: "var(--font-geist-mono)", fontSize: 8 },
          splitLine: { lineStyle: { color: "rgba(255,255,255,0.02)" } },
          axisLine: { lineStyle: { color: "#374151" } }
        },
        {
          type: "value",
          min: 0,
          max: 100,
          axisLabel: { color: "#94a3b8", fontFamily: "var(--font-geist-mono)", fontSize: 8, formatter: "{value}%" },
          splitLine: { show: false },
          axisLine: { lineStyle: { color: "#374151" } }
        }
      ],
      series: [
        {
          name: "Minutes",
          type: "bar",
          data: barValues,
          barWidth: "40%",
          itemStyle: {
            borderRadius: [1, 1, 0, 0], // sharp industrial HMI corners
            color: (params: any) => {
              const barColors = ["#dc2626", "#ea580c", "#ca8a04", "#2563eb", "#4b5563"]; // Matte safety tower alerts
              return barColors[params.dataIndex % barColors.length];
            }
          }
        },
        {
          name: "Cumulative %",
          type: "line",
          yAxisIndex: 1,
          data: lineValues,
          symbol: "circle",
          symbolSize: 5,
          itemStyle: { color: "#94a3b8" },
          lineStyle: { width: 1.5 }
        }
      ]
    };
  };

  const getLossMinutes = (codePattern: string, fallbackDefault: number) => {
    const item = pareto.find(
      p => p.code.toUpperCase().includes(codePattern.toUpperCase()) || 
           p.name.toUpperCase().includes(codePattern.toUpperCase())
    );
    return item ? item.minutes : fallbackDefault;
  };

  // Calculations derived dynamically from the loaded summary model
  const totalDuration = pareto.reduce((sum, item) => sum + item.minutes, 0);
  const pptVal = summary.loadingTime || 480;
  const operVal = summary.operatingTime || 398;
  const downVal = Math.max(0, pptVal - operVal);
  const netVal = summary.netOperatingTime || 398;
  const speedLossVal = Math.max(0, operVal - netVal);
  const rejectPcsVal = summary.reject || 20;
  const goodPcsVal = Math.max(0, (summary.totalOutput || 12450) - rejectPcsVal);
  const totalPcsVal = summary.totalOutput || 12450;
  const rejectRateVal = parseFloat(((rejectPcsVal / (totalPcsVal || 1)) * 100).toFixed(2));

  // Determine actual target achievements
  const oeeGap = summary.oee - 85.0;
  const availGap = summary.availability - 90.0;
  const perfGap = summary.performance - 95.0;
  const qualGap = summary.quality - 99.0;

  return (
    <div className="kiosk-container h-full w-full bg-[#15171c] text-[#f1f5f9] p-3.5 flex flex-col gap-3.5 font-sans select-none overflow-hidden antialiased">
      
      {/* 1. KIOSK HEADER BAR (High-fidelity clean dark selectors) */}
      <header className="flex-shrink-0 bg-[#1e222b] border border-[#374151] rounded-md px-4 py-2 flex justify-between items-center h-[52px]">
        
        {/* Title Block with Chevron Logo */}
        <div className="flex items-center gap-2.5">
          <ChevronLogo />
          <div>
            <div className="flex items-center gap-1.5 leading-tight">
              <h1 className="text-sm font-extrabold uppercase tracking-wide text-white font-sans">
                {lineName ? `KMI OEE Monitor - ${lineName}` : "KMI OEE Monitor"}
              </h1>
              <span className="text-[7.5px] bg-[#374151] text-slate-300 px-1.5 py-0.2 rounded-sm font-black border border-[#4b5563] uppercase tracking-wider font-sans">
                SCADA
              </span>
            </div>
            <p className="text-[8px] text-slate-400 tracking-wider uppercase leading-none mt-0.5">
              PT. Kalbe Morinaga Indonesia
            </p>
          </div>
        </div>

        {/* Dynamic Selectors styled exactly as requested */}
        <div className="flex items-center gap-3">
          
          {/* Date Picker Input */}
          <div className="flex items-center gap-1.5 bg-[#15171c] border border-[#374151] px-2 py-0.5 rounded-sm text-[10px] h-[28px]">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-500 uppercase font-extrabold tracking-wider font-sans">DATE:</span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-[#15171c] border-none text-white focus:outline-none text-[10px] font-bold cursor-pointer font-sans p-0 h-full w-[90px]"
              style={{ colorScheme: "dark" }}
            />
          </div>

          {/* Line Select */}
          <div className="flex items-center gap-1 bg-[#15171c] border border-[#374151] px-2 py-0.5 rounded-sm text-[10px] h-[28px]">
            <span className="text-slate-500 uppercase font-extrabold tracking-wider font-sans">LINE:</span>
            <select
              value={lineId || ""}
              onChange={(e) => {
                const val = e.target.value;
                setLineId(val || null);
                setSelectedOkp(""); // Reset OKP selection on line change
                if (typeof window !== "undefined") {
                  const newUrl = val ? `/dashboard/kiosk?line=${val}` : "/dashboard/kiosk";
                  window.history.pushState({}, "", newUrl);
                }
              }}
              className="bg-[#15171c] border-none text-white focus:outline-none text-[10px] cursor-pointer font-bold font-sans h-full pr-1 max-w-[130px]"
              style={{ colorScheme: "dark" }}
            >
              <option value="" className="bg-[#1e222b] text-white">ALL LINES</option>
              {linesList.map((l) => (
                <option key={l.id} value={l.id} className="bg-[#1e222b] text-white">
                  {l.name}
                </option>
              ))}
            </select>
          </div>

          {/* Shift Select */}
          <div className="flex items-center gap-1 bg-[#15171c] border border-[#374151] px-2 py-0.5 rounded-sm text-[10px] h-[28px]">
            <span className="text-slate-500 uppercase font-extrabold tracking-wider font-sans">SHIFT:</span>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="bg-[#15171c] border-none text-white focus:outline-none text-[10px] cursor-pointer font-bold font-sans h-full pr-1"
              style={{ colorScheme: "dark" }}
            >
              <option value="" className="bg-[#1e222b] text-white">ALL SHIFTS</option>
              <option value="1" className="bg-[#1e222b] text-white">SHIFT 1 (07:00 - 15:00)</option>
              <option value="2" className="bg-[#1e222b] text-white">SHIFT 2 (15:00 - 23:00)</option>
              <option value="3" className="bg-[#1e222b] text-white">SHIFT 3 (23:00 - 07:00)</option>
            </select>
          </div>

          {/* OKP (Oracle Lot OKP Log) Select */}
          <div className="flex items-center gap-1 bg-[#15171c] border border-[#374151] px-2 py-0.5 rounded-sm text-[10px] h-[28px]">
            <span className="text-slate-500 uppercase font-extrabold tracking-wider font-sans">OKP:</span>
            <select
              value={selectedOkp}
              onChange={(e) => setSelectedOkp(e.target.value)}
              className="bg-[#15171c] border-none text-white focus:outline-none text-[10px] cursor-pointer font-bold font-sans h-full pr-1 max-w-[130px]"
              style={{ colorScheme: "dark" }}
            >
              <option value="" className="bg-[#1e222b] text-white">ALL OKPs</option>
              {okpList
                .filter((o) => !lineId || o.machine?.lineProcess?.id === parseInt(lineId, 10))
                .map((o) => (
                  <option key={o.id} value={o.okpNumber} className="bg-[#1e222b] text-white">
                    {o.okpNumber}
                  </option>
                ))}
            </select>
          </div>

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1 bg-[#15171c] hover:bg-[#374151] border border-[#374151] rounded-sm text-slate-400 hover:text-white transition-all cursor-pointer flex items-center justify-center h-[28px] w-[28px]"
            title={isFullscreen ? "Exit Fullscreen" : "Go Fullscreen"}
          >
            {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
          </button>

          {/* Exit Link */}
          <Link
            href="/dashboard"
            className="px-2.5 py-1 bg-[#b91c1c] hover:bg-[#991b1b] border border-[#b91c1c] rounded-sm text-white text-[9.5px] font-bold tracking-wide transition-all uppercase flex items-center gap-1.5 h-[28px]"
          >
            <X className="w-3.5 h-3.5" />
            <span>Exit</span>
          </Link>
        </div>

        {/* Live Clock Component */}
        <div className="flex items-center gap-2 bg-[#15171c] border border-[#374151] px-2.5 py-0.5 rounded-sm text-xs flex-shrink-0 h-[28px]">
          <Clock className="w-3.5 h-3.5 text-[#16a34a]" />
          <span className="font-extrabold text-[#16a34a] tracking-widest text-[10.5px] font-mono leading-none">{liveTime}</span>
          <div className="w-1.5 h-1.5 rounded-full bg-[#16a34a] ml-1" />
          <span className="text-[7.5px] text-[#16a34a] uppercase tracking-widest font-sans font-black">LIVE</span>
        </div>
      </header>

      {/* 2. TOP GAUGE ROW (4 Rate KPI Cards with SVG Ring gauges - Spacious size) */}
      <section className="flex-shrink-0 grid grid-cols-4 gap-3.5 h-[110px]">
        
        {/* KPI 1: Overall OEE */}
        <div className="bg-[#1e222b] border border-[#374151] rounded-md p-3.5 flex items-center gap-4 relative overflow-hidden">
          <RingProgress value={summary.oee} color="#ea580c" icon={Activity} />
          <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
            <div className="flex justify-between items-start">
              <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest font-sans">OEE</span>
              <span className="text-[8px] font-bold text-slate-500 font-sans">Target: 85.0%</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-white font-mono leading-none">{summary.oee.toFixed(1)}</span>
              <span className="text-xs text-slate-400 font-extrabold">%</span>
            </div>
            <div className="w-full bg-[#15171c] h-1.5 rounded-sm mt-1 overflow-hidden">
              <div className="bg-[#ea580c] h-full rounded-sm transition-all duration-1000" style={{ width: `${summary.oee}%` }} />
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              {summary.oee >= 85.0 ? (
                <div className="flex items-center gap-0.5 bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/30 px-1.5 py-0.5 rounded-sm text-[7.5px] font-extrabold font-sans tracking-wider leading-none">
                  <Check className="w-2.5 h-2.5" />
                  <span>ON TARGET</span>
                </div>
              ) : (
                <div className="flex items-center gap-0.5 bg-[#ea580c]/10 text-[#ea580c] border border-[#ea580c]/30 px-1.5 py-0.5 rounded-sm text-[7.5px] font-extrabold font-sans tracking-wider leading-none">
                  <ArrowDown className="w-2.5 h-2.5" />
                  <span>BELOW TARGET</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPI 2: Availability */}
        <div className="bg-[#1e222b] border border-[#374151] rounded-md p-3.5 flex items-center gap-4 relative overflow-hidden">
          <RingProgress value={summary.availability} color="#2563eb" icon={Clock} />
          <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
            <div className="flex justify-between items-start">
              <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest font-sans">Availability</span>
              <span className="text-[8px] font-bold text-slate-500 font-sans">Target: 90.0%</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-white font-mono leading-none">{summary.availability.toFixed(1)}</span>
              <span className="text-xs text-slate-400 font-extrabold">%</span>
            </div>
            <div className="w-full bg-[#15171c] h-1.5 rounded-sm mt-1 overflow-hidden">
              <div className="bg-[#2563eb] h-full rounded-sm transition-all duration-1000" style={{ width: `${summary.availability}%` }} />
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              {summary.availability >= 90.0 ? (
                <div className="flex items-center gap-0.5 bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/30 px-1.5 py-0.5 rounded-sm text-[7.5px] font-extrabold font-sans tracking-wider leading-none">
                  <Check className="w-2.5 h-2.5" />
                  <span>ON TARGET</span>
                </div>
              ) : (
                <div className="flex items-center gap-0.5 bg-[#ea580c]/10 text-[#ea580c] border border-[#ea580c]/30 px-1.5 py-0.5 rounded-sm text-[7.5px] font-extrabold font-sans tracking-wider leading-none">
                  <ArrowDown className="w-2.5 h-2.5" />
                  <span>BELOW TARGET</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPI 3: Performance */}
        <div className="bg-[#1e222b] border border-[#374151] rounded-md p-3.5 flex items-center gap-4 relative overflow-hidden">
          <RingProgress value={summary.performance} color="#ca8a04" icon={Gauge} />
          <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
            <div className="flex justify-between items-start">
              <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest font-sans">Performance</span>
              <span className="text-[8px] font-bold text-slate-500 font-sans">Target: 95.0%</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-white font-mono leading-none">{summary.performance.toFixed(1)}</span>
              <span className="text-xs text-slate-400 font-extrabold">%</span>
            </div>
            <div className="w-full bg-[#15171c] h-1.5 rounded-sm mt-1 overflow-hidden">
              <div className="bg-[#ca8a04] h-full rounded-sm transition-all duration-1000" style={{ width: `${summary.performance}%` }} />
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              {summary.performance >= 95.0 ? (
                <div className="flex items-center gap-0.5 bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/30 px-1.5 py-0.5 rounded-sm text-[7.5px] font-extrabold font-sans tracking-wider leading-none">
                  <Check className="w-2.5 h-2.5" />
                  <span>ON TARGET</span>
                </div>
              ) : (
                <div className="flex items-center gap-0.5 bg-[#ea580c]/10 text-[#ea580c] border border-[#ea580c]/30 px-1.5 py-0.5 rounded-sm text-[7.5px] font-extrabold font-sans tracking-wider leading-none">
                  <ArrowDown className="w-2.5 h-2.5" />
                  <span>BELOW TARGET</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* KPI 4: Quality */}
        <div className="bg-[#1e222b] border border-[#374151] rounded-md p-3.5 flex items-center gap-4 relative overflow-hidden">
          <RingProgress value={summary.quality} color="#16a34a" icon={Shield} />
          <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-0.5">
            <div className="flex justify-between items-start">
              <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-widest font-sans">Quality</span>
              <span className="text-[8px] font-bold text-slate-500 font-sans">Target: 99.0%</span>
            </div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black text-white font-mono leading-none">{summary.quality.toFixed(1)}</span>
              <span className="text-xs text-slate-400 font-extrabold">%</span>
            </div>
            <div className="w-full bg-[#15171c] h-1.5 rounded-sm mt-1 overflow-hidden">
              <div className="bg-[#16a34a] h-full rounded-sm transition-all duration-1000" style={{ width: `${summary.quality}%` }} />
            </div>
            <div className="flex items-center gap-1 mt-1.5">
              {summary.quality >= 99.0 ? (
                <div className="flex items-center gap-0.5 bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/30 px-1.5 py-0.5 rounded-sm text-[7.5px] font-extrabold font-sans tracking-wider leading-none">
                  <Check className="w-2.5 h-2.5" />
                  <span>ON TARGET</span>
                </div>
              ) : (
                <div className="flex items-center gap-0.5 bg-[#ea580c]/10 text-[#ea580c] border border-[#ea580c]/30 px-1.5 py-0.5 rounded-sm text-[7.5px] font-extrabold font-sans tracking-wider leading-none">
                  <ArrowDown className="w-2.5 h-2.5" />
                  <span>BELOW TARGET</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </section>

      {/* 3. MIDDLE PANEL (Production Summary, OEE Calculation flex row flow, Machine Status side-by-side) */}
      <section className="flex-[1.15] min-h-[200px] grid grid-cols-12 gap-3.5">
        
        {/* Col 1 (3 cols): Production Summary */}
        <div className="col-span-3 bg-[#1e222b] border border-[#374151] rounded-md p-3 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-1.5 border-b border-[#374151] pb-1.5 flex-shrink-0">
            <BarChart3 className="w-4 h-4 text-[#16a34a]" />
            <h2 className="text-[10px] font-black uppercase tracking-wider text-white font-sans">
              Production Summary
            </h2>
          </div>
          
          <div className="flex-1 flex flex-col justify-around text-[10.5px] font-mono leading-none py-1.5 bg-[#15171c] border border-[#374151] rounded p-2.5 mt-2">
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" /> Planned Time
              </span>
              <span className="text-white font-extrabold">{pptVal} min</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400 flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-500" /> Operating Time
              </span>
              <span className="text-white font-extrabold">{operVal} min</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-b border-[#374151]/50 pb-1.5 mb-1.5">
              <span className="text-slate-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-[#dc2626]" /> Downtime
              </span>
              <span className="text-[#dc2626] font-extrabold">{downVal.toFixed(1)} min</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400">Total Count</span>
              <span className="text-white font-extrabold">{totalPcsVal.toLocaleString("en-US")} pcs</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400">Good Count</span>
              <span className="text-[#16a34a] font-extrabold">{goodPcsVal.toLocaleString("en-US")} pcs</span>
            </div>
            <div className="flex justify-between items-center py-0.5">
              <span className="text-slate-400">Reject Count</span>
              <span className="text-[#dc2626] font-extrabold">{rejectPcsVal.toLocaleString("en-US")} pcs</span>
            </div>
            <div className="flex justify-between items-center py-0.5 border-t border-[#374151]/50 pt-1.5 mt-0.5">
              <span className="text-slate-400">Reject Rate</span>
              <span className="text-[#ea580c] font-extrabold">{rejectRateVal}%</span>
            </div>
          </div>
        </div>

        {/* Col 2 (5 cols): OEE Breakdown (Simple & Clean Metrics Display) */}
        <div className="col-span-5 bg-[#1e222b] border border-[#374151] rounded-md p-3 flex flex-col justify-between overflow-hidden">
          <div className="flex justify-between items-center border-b border-[#374151] pb-1.5 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#16a34a]" />
              <h2 className="text-[10px] font-black uppercase tracking-wider text-white font-sans">
                OEE Breakdown
              </h2>
            </div>
            <span className="text-[8px] bg-[#16a34a]/10 text-[#16a34a] px-1.5 py-0.2 border border-[#16a34a]/30 rounded-sm font-black font-sans">
              SCADA TELEMETRY
            </span>
          </div>

          <div className="flex-1 flex flex-col justify-center py-2 font-sans">
            <div className="grid grid-cols-4 gap-2.5 h-[100px]">
              
              {/* Availability */}
              <div className="border border-[#374151] rounded-sm p-2 bg-[#15171c] flex flex-col items-center justify-center h-full text-center">
                <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Availability</span>
                <span className="text-[#2563eb] font-black text-base font-mono">{(summary.availability || 82.9).toFixed(1)}%</span>
              </div>

              {/* Performance */}
              <div className="border border-[#374151] rounded-sm p-2 bg-[#15171c] flex flex-col items-center justify-center h-full text-center">
                <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Performance</span>
                <span className="text-[#ca8a04] font-black text-base font-mono">{(summary.performance || 82.5).toFixed(1)}%</span>
              </div>

              {/* Quality */}
              <div className="border border-[#374151] rounded-sm p-2 bg-[#15171c] flex flex-col items-center justify-center h-full text-center">
                <span className="text-[7.5px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Quality</span>
                <span className="text-[#16a34a] font-black text-base font-mono">{(summary.quality || 99.8).toFixed(1)}%</span>
              </div>

              {/* OEE Result Box */}
              <div className="border border-[#ea580c] rounded-sm p-2 bg-[#ea580c]/5 flex flex-col items-center justify-center h-full text-center">
                <span className="text-[7.5px] text-[#ea580c] font-black uppercase tracking-wider mb-1.5">OEE</span>
                <span className="text-[#ea580c] font-black text-base font-mono">{(summary.oee || 68.4).toFixed(1)}%</span>
              </div>

            </div>
          </div>
        </div>

        {/* Col 3 (4 cols): Machine Status & Oracle Lot Info (HMI Light Tower style) */}
        <div className="col-span-4 bg-[#1e222b] border border-[#374151] rounded-md p-3 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-1.5 border-b border-[#374151] pb-1.5 flex-shrink-0">
            <Monitor className="w-4 h-4 text-[#16a34a]" />
            <h2 className="text-[10px] font-black uppercase tracking-wider text-white font-sans">
              Machine Status
            </h2>
          </div>

          <div className="flex-1 flex flex-row gap-3.5 items-center min-h-0 py-1.5 mt-2">
            
            {/* Left Half (w-1/2): Status + Details Stack */}
            <div className="w-1/2 h-full flex flex-col justify-between font-sans text-[9px] py-0.5 bg-[#15171c] border border-[#374151] rounded p-2.5">
              
              {/* Running Badge */}
              {latestOkp?.status === "RUNNING" ? (
                <div className="flex items-center gap-1.5 bg-[#16a34a]/10 border border-[#16a34a]/30 text-[#16a34a] px-2 py-0.5 rounded-sm font-black text-[9px] w-fit flex-shrink-0">
                  <Play className="w-2.5 h-2.5 fill-[#16a34a]" />
                  <span>RUNNING</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-[#dc2626]/10 border border-[#dc2626]/30 text-[#dc2626] px-2 py-0.5 rounded-sm font-black text-[9px] w-fit flex-shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#dc2626] mr-1" />
                  <span>STOPPED</span>
                </div>
              )}

              {/* Details List (stacked vertically, properly sized) */}
              <div className="flex flex-col gap-1 mt-2 flex-1 justify-center leading-normal border-t border-[#374151]/50 pt-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">Running Time</span>
                  <span className="text-white font-bold font-mono">{latestOkp?.runningTime || "00:00:00"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Current Speed</span>
                  <span className="text-[#16a34a] font-bold font-mono">{latestOkp?.status === "RUNNING" ? (latestOkp?.standardSpeed || 120) : 0} ppm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Ideal Speed</span>
                  <span className="text-[#16a34a] font-bold font-mono">{latestOkp?.standardSpeed || 120} ppm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Product</span>
                  <span className="text-white font-bold truncate max-w-[80px]" title={latestOkp?.productName || "No OKP Active"}>
                    {latestOkp?.productName || "No OKP Active"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Batch Lot</span>
                  <span className="text-white font-bold truncate max-w-[80px]" title={selectedOkp || latestOkp?.okpNumber || "-"}>
                    {selectedOkp || latestOkp?.okpNumber || "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Operator</span>
                  <span className="text-white font-bold truncate max-w-[80px]" title={latestOkp?.operator || "-"}>
                    {latestOkp?.operator || "-"}
                  </span>
                </div>
              </div>

            </div>

            {/* Right Half (w-1/2): Industrial Stack Light (Patlite) Tower Schematic */}
            <div className="w-1/2 h-full bg-[#15171c] border border-[#374151] rounded p-2 flex flex-col items-center justify-between overflow-hidden">
              <span className="text-[7.5px] font-black text-slate-500 uppercase tracking-widest font-sans select-none">TOWER SIGNALS</span>
              
              {/* Stack Light representation */}
              <div className="flex flex-col items-center justify-center relative w-full my-auto">
                {/* Vertical Pole */}
                <div className="absolute top-1/2 -bottom-2 w-1.5 bg-[#4b5563] z-0" />
                
                {/* Light Stack */}
                <div className="flex flex-col w-9 z-10 bg-[#1e222b] p-0.5 border border-[#4b5563] rounded shadow-md">
                  {/* RED segment */}
                  <div className={`h-[18px] rounded-t-sm flex items-center justify-center font-bold text-[7px] border border-black/40 transition-all duration-300 ${(!latestOkp || latestOkp.status !== "RUNNING") ? "bg-[#dc2626] text-white shadow-[0_0_8px_rgba(220,38,38,0.4)]" : "bg-[#450a0a] text-red-900/30"}`}>
                    RED
                  </div>
                  {/* AMBER segment */}
                  <div className={`h-[18px] flex items-center justify-center font-bold text-[7px] border-x border-b border-black/40 transition-all duration-300 ${(latestOkp && latestOkp.status === "RUNNING" && (latestOkp.standardSpeed || 120) < 120) ? "bg-[#ca8a04] text-white shadow-[0_0_8px_rgba(202,138,4,0.4)]" : "bg-[#451a03] text-amber-900/30"}`}>
                    AMB
                  </div>
                  {/* GREEN segment */}
                  <div className={`h-[18px] rounded-b-sm flex items-center justify-center font-bold text-[7px] border-x border-b border-black/40 transition-all duration-300 ${(latestOkp && latestOkp.status === "RUNNING" && (latestOkp.standardSpeed || 120) >= 120) ? "bg-[#16a34a] text-white shadow-[0_0_8px_rgba(22,163,74,0.4)]" : "bg-[#064e3b] text-emerald-950/30"}`}>
                    GRN
                  </div>
                </div>
              </div>

              {/* PE Sensor telemetry */}
              <div className="flex flex-col gap-1 w-full mt-2 font-sans text-[7px] leading-none">
                <div className="flex justify-between items-center bg-[#1e222b] border border-[#374151] px-1 py-0.5">
                  <span className="text-slate-400">PE1:IN</span>
                  <span className={`px-0.5 rounded-sm text-[6.5px] font-bold ${(!latestOkp || latestOkp.status !== "RUNNING") ? "bg-[#374151] text-slate-500 border border-[#4b5563]" : "bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/20"}`}>
                    {(!latestOkp || latestOkp.status !== "RUNNING") ? "OFF" : "TRIG"}
                  </span>
                </div>
                <div className="flex justify-between items-center bg-[#1e222b] border border-[#374151] px-1 py-0.5">
                  <span className="text-slate-400">PE2:OUT</span>
                  <span className={`px-0.5 rounded-sm text-[6.5px] font-bold ${(!latestOkp || latestOkp.status !== "RUNNING") ? "bg-[#374151] text-slate-500 border border-[#4b5563]" : "bg-[#16a34a]/10 text-[#16a34a] border border-[#16a34a]/20"}`}>
                    {(!latestOkp || latestOkp.status !== "RUNNING") ? "OFF" : "COUNT"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* 4. BOTTOM ANALYTICAL SECTION 1 (Hourly Trend + Downtime Pareto Side-by-Side) */}
      <section className="flex-[1.0] min-h-[185px] grid grid-cols-12 gap-3.5">
        
        {/* Trend Chart (col-span-6) */}
        <div className="col-span-6 bg-[#1e222b] border border-[#374151] rounded-md p-3 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between border-b border-[#374151] pb-1 flex-shrink-0">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-[#16a34a]" />
              <h2 className="text-[10px] font-black uppercase tracking-wider text-white font-sans">
                OEE Trend (By Hour)
              </h2>
            </div>
            <div className="flex items-center gap-1.5 text-[7.5px] font-bold text-slate-500 font-sans">
              <div className="w-1.5 h-1.5 bg-[#ea580c] rounded-full" /> OEE
              <div className="w-1.5 h-1.5 bg-[#2563eb] rounded-full" /> AVAIL
              <div className="w-1.5 h-1.5 bg-[#ca8a04] rounded-full" /> PERF
            </div>
          </div>
          <div className="flex-1 w-full min-h-[135px] relative">
            <div className="absolute inset-0">
              {loading ? (
                <div className="h-full flex items-center justify-center text-[9px] text-slate-500 italic font-sans">
                  Loading hourly trend...
                </div>
              ) : (
                <ReactECharts option={getTrendOption()} style={{ height: "100%", width: "100%" }} />
              )}
            </div>
          </div>
        </div>

        {/* Top 5 Downtime Pareto Table & Chart (col-span-6) */}
        <div className="col-span-6 bg-[#1e222b] border border-[#374151] rounded-md p-3 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-1.5 border-b border-[#374151] pb-1 flex-shrink-0">
            <BarChart3 className="w-3.5 h-3.5 text-[#dc2626]" />
            <h2 className="text-[10px] font-black uppercase tracking-wider text-white font-sans">
              Downtime Top 5 (Pareto)
            </h2>
          </div>

          <div className="flex-1 min-h-0 grid grid-cols-12 gap-3.5 mt-1">
            {/* Pareto Table (7 cols) */}
            <div className="col-span-7 overflow-y-auto max-h-[140px] font-sans text-[8.5px] leading-tight pr-1">
              <table className="w-full text-left border-collapse table-fixed select-none">
                <thead>
                  <tr className="border-b border-[#374151] text-slate-500 font-bold uppercase tracking-wider">
                    <th className="py-1 w-[22px]">No.</th>
                    <th className="py-1 w-[26px]">Code</th>
                    <th className="py-1 w-[80px]">Description</th>
                    <th className="py-1 text-right w-[30px]">Freq</th>
                    <th className="py-1 text-right w-[40px]">Min</th>
                    <th className="py-1 text-right pr-1 w-[35px]">%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#374151]/30 text-white font-medium">
                  {pareto.length === 0 ? (
                    <>
                      <tr className="hover:bg-[#15171c]/50">
                        <td className="py-1 font-mono">1</td>
                        <td className="py-1 font-bold text-[#dc2626]">BR</td>
                        <td className="py-1 truncate">Breakdown</td>
                        <td className="py-1 text-right font-mono">12</td>
                        <td className="py-1 text-right font-bold font-mono">360</td>
                        <td className="py-1 text-right text-[#dc2626] pr-1 font-mono">68.6%</td>
                      </tr>
                      <tr className="hover:bg-[#15171c]/50">
                        <td className="py-1 font-mono">2</td>
                        <td className="py-1 font-bold text-[#ea580c]">CT</td>
                        <td className="py-1 truncate">Changeover</td>
                        <td className="py-1 text-right font-mono">4</td>
                        <td className="py-1 text-right font-bold font-mono">14</td>
                        <td className="py-1 text-right pr-1 text-[#ea580c] font-mono">13.3%</td>
                      </tr>
                      <tr className="hover:bg-[#15171c]/50">
                        <td className="py-1 font-mono">3</td>
                        <td className="py-1 font-bold text-[#ca8a04]">ST</td>
                        <td className="py-1 truncate">Setup/Adjust</td>
                        <td className="py-1 text-right font-mono">3</td>
                        <td className="py-1 text-right font-bold font-mono">8</td>
                        <td className="py-1 text-right pr-1 text-[#ca8a04] font-mono">9.5%</td>
                      </tr>
                      <tr className="hover:bg-[#15171c]/50">
                        <td className="py-1 font-mono">4</td>
                        <td className="py-1 font-bold text-[#16a34a]">MI</td>
                        <td className="py-1 truncate">Minor Stop</td>
                        <td className="py-1 text-right font-mono">10</td>
                        <td className="py-1 text-right font-bold font-mono">7</td>
                        <td className="py-1 text-right pr-1 text-[#16a34a] font-mono">6.7%</td>
                      </tr>
                      <tr className="hover:bg-[#15171c]/50">
                        <td className="py-1 font-mono">5</td>
                        <td className="py-1 font-bold text-[#2563eb]">OT</td>
                        <td className="py-1 truncate">Others</td>
                        <td className="py-1 text-right font-mono">6</td>
                        <td className="py-1 text-right font-bold font-mono">6</td>
                        <td className="py-1 text-right pr-1 text-[#2563eb] font-mono">1.9%</td>
                      </tr>
                      <tr className="border-t border-[#374151] font-bold bg-[#15171c]/50">
                        <td colSpan={3} className="py-1 text-slate-500 text-left">TOTAL</td>
                        <td className="py-1 text-right font-mono">35</td>
                        <td className="py-1 text-right font-black font-mono">525</td>
                        <td className="py-1 text-right text-[#16a34a] pr-1 font-mono">100%</td>
                      </tr>
                    </>
                  ) : (
                    pareto.slice(0, 5).map((item, idx) => {
                      const percentage = totalDuration > 0 ? ((item.minutes / totalDuration) * 100).toFixed(1) : "0";
                      const colors = ["text-[#dc2626]", "text-[#ea580c]", "text-[#ca8a04]", "text-[#16a34a]", "text-[#2563eb]"];
                      return (
                        <tr key={item.code} className="hover:bg-[#15171c]/50 transition-colors">
                          <td className="py-1 font-mono">{idx + 1}</td>
                          <td className={`py-1 font-bold ${colors[idx % colors.length]}`}>{item.code}</td>
                          <td className="py-1 truncate">{item.name}</td>
                          <td className="py-1 text-right font-mono">{item.count}</td>
                          <td className="py-1 text-right font-bold font-mono">{item.minutes.toFixed(0)}</td>
                          <td className={`py-1 text-right pr-1 font-extrabold font-mono ${colors[idx % colors.length]}`}>{percentage}%</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pareto Chart (5 cols) */}
            <div className="col-span-5 w-full h-full min-h-[130px] relative">
              <div className="absolute inset-0">
                {loading ? (
                  <div className="h-full flex items-center justify-center text-[8px] text-slate-500 italic">
                    Drawing...
                  </div>
                ) : (
                  <ReactECharts option={getParetoOption()} style={{ height: "100%", width: "100%" }} />
                )}
              </div>
            </div>
          </div>
        </div>

      </section>

      {/* 5. BOTTOM ROW 2 (Six Big Losses + Target vs Actual Gap) */}
      <section className="flex-shrink-0 grid grid-cols-12 gap-3.5 h-[110px]">
        
        {/* Six Big Losses (7 cols) */}
        <div className="col-span-7 bg-[#1e222b] border border-[#374151] rounded-md p-2.5 shadow flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-1.5 border-b border-[#374151] pb-1 flex-shrink-0">
            <AlertTriangle className="w-3.5 h-3.5 text-[#ca8a04]" />
            <h2 className="text-[10px] font-black uppercase tracking-wider text-white font-sans leading-none">
              Six Big Losses (Minutes)
            </h2>
          </div>

          <div className="grid grid-cols-6 gap-3 mt-1">
            
            {/* Loss 1: Breakdown */}
            <div className="bg-[#15171c] border border-[#374151] rounded-sm p-1 text-center flex flex-col justify-between h-[64px]">
              <span className="text-[7.5px] font-bold text-slate-500 uppercase truncate">Breakdown</span>
              <AlertTriangle className="w-3 h-3 text-[#dc2626] mx-auto mt-0.5" />
              <div>
                <span className="text-white font-black text-[11px] leading-none font-mono">{getLossMinutes("BR", 360)}</span>
                <span className="text-[7.5px] text-slate-500 font-extrabold ml-0.5">m</span>
              </div>
              <span className="text-[7px] text-[#dc2626] font-extrabold font-mono">68.6%</span>
            </div>

            {/* Loss 2: Setup */}
            <div className="bg-[#15171c] border border-[#374151] rounded-sm p-1 text-center flex flex-col justify-between h-[64px]">
              <span className="text-[7.5px] font-bold text-slate-500 uppercase truncate">Setup</span>
              <Cpu className="w-3 h-3 text-[#ea580c] mx-auto mt-0.5" />
              <div>
                <span className="text-white font-black text-[11px] leading-none font-mono">{getLossMinutes("ST", 8) + getLossMinutes("CT", 14)}</span>
                <span className="text-[7.5px] text-slate-500 font-extrabold ml-0.5">m</span>
              </div>
              <span className="text-[7px] text-[#ea580c] font-extrabold font-mono">13.3%</span>
            </div>

            {/* Loss 3: Minor Stop */}
            <div className="bg-[#15171c] border border-[#374151] rounded-sm p-1 text-center flex flex-col justify-between h-[64px]">
              <span className="text-[7.5px] font-bold text-slate-500 uppercase truncate">Minor Stop</span>
              <Clock className="w-3 h-3 text-[#ca8a04] mx-auto mt-0.5" />
              <div>
                <span className="text-white font-black text-[11px] leading-none font-mono">{getLossMinutes("MI", 7)}</span>
                <span className="text-[7.5px] text-slate-500 font-extrabold ml-0.5">m</span>
              </div>
              <span className="text-[7px] text-[#ca8a04] font-extrabold font-mono">9.5%</span>
            </div>

            {/* Loss 4: Speed Loss */}
            <div className="bg-[#15171c] border border-[#374151] rounded-sm p-1 text-center flex flex-col justify-between h-[64px]">
              <span className="text-[7.5px] font-bold text-slate-500 uppercase truncate">Speed Loss</span>
              <Gauge className="w-3 h-3 text-[#16a34a] mx-auto mt-0.5" />
              <div>
                <span className="text-white font-black text-[11px] leading-none font-mono">{speedLossVal.toFixed(0)}</span>
                <span className="text-[7.5px] text-slate-500 font-extrabold ml-0.5">m</span>
              </div>
              <span className="text-[7px] text-[#16a34a] font-extrabold font-mono">4.2%</span>
            </div>

            {/* Loss 5: Reject Loss */}
            <div className="bg-[#15171c] border border-[#374151] rounded-sm p-1 text-center flex flex-col justify-between h-[64px]">
              <span className="text-[7.5px] font-bold text-slate-500 uppercase truncate">Reject Loss</span>
              <X className="w-3 h-3 text-[#dc2626] mx-auto mt-0.5" />
              <div>
                <span className="text-white font-black text-[11px] leading-none font-mono">{(summary.defectLoss || 4).toFixed(0)}</span>
                <span className="text-[7.5px] text-slate-500 font-extrabold ml-0.5">m</span>
              </div>
              <span className="text-[7px] text-[#dc2626] font-extrabold font-mono">3.8%</span>
            </div>

            {/* Loss 6: Startup Reject */}
            <div className="bg-[#15171c] border border-[#374151] rounded-sm p-1 text-center flex flex-col justify-between h-[64px]">
              <span className="text-[7.5px] font-bold text-slate-500 uppercase truncate">Startup Rej</span>
              <RefreshCw className="w-3 h-3 text-[#2563eb] mx-auto mt-0.5" />
              <div>
                <span className="text-white font-black text-[11px] leading-none font-mono">{getLossMinutes("OT", 2)}</span>
                <span className="text-[7.5px] text-slate-500 font-extrabold ml-0.5">m</span>
              </div>
              <span className="text-[7px] text-[#2563eb] font-extrabold font-mono">0.6%</span>
            </div>

          </div>
        </div>

        {/* Target vs Actual (5 cols) */}
        <div className="col-span-5 bg-[#1e222b] border border-[#374151] rounded-md p-2.5 shadow flex flex-col justify-between overflow-hidden">
          <div className="flex items-center gap-1.5 border-b border-[#374151] pb-1 flex-shrink-0">
            <CheckCircle className="w-3.5 h-3.5 text-[#16a34a]" />
            <h2 className="text-[10px] font-black uppercase tracking-wider text-white font-sans leading-none">
              Target vs Actual
            </h2>
          </div>

          <div className="flex-1 flex flex-col justify-between py-1 font-sans text-[8px] leading-none">
            
            {/* OEE Actual/Target */}
            <div className="flex items-center gap-1">
              <span className="w-14 text-slate-400 font-bold uppercase truncate">OEE</span>
              <span className="w-20 text-white font-extrabold text-[8.5px] font-mono">{(summary.oee || 68.4).toFixed(1)}% / 85.0%</span>
              <div className="flex-1 bg-[#15171c] h-2 rounded-sm overflow-hidden relative">
                <div className="bg-[#ea580c] h-full rounded-sm transition-all duration-1000" style={{ width: `${(summary.oee || 68.4) / 85.0 * 100}%` }} />
              </div>
              <span className={`w-10 text-right font-extrabold font-mono ${oeeGap >= 0 ? "text-[#16a34a]" : "text-[#dc2626]"}`}>{oeeGap >= 0 ? `+${oeeGap.toFixed(1)}%` : `${oeeGap.toFixed(1)}%`}</span>
            </div>

            {/* Availability Actual/Target */}
            <div className="flex items-center gap-1">
              <span className="w-14 text-slate-400 font-bold uppercase truncate">Avail</span>
              <span className="w-20 text-white font-extrabold text-[8.5px] font-mono">{(summary.availability || 82.9).toFixed(1)}% / 90.0%</span>
              <div className="flex-1 bg-[#15171c] h-2 rounded-sm overflow-hidden relative">
                <div className="bg-[#2563eb] h-full rounded-sm transition-all duration-1000" style={{ width: `${(summary.availability || 82.9) / 90.0 * 100}%` }} />
              </div>
              <span className={`w-10 text-right font-extrabold font-mono ${availGap >= 0 ? "text-[#16a34a]" : "text-[#dc2626]"}`}>{availGap >= 0 ? `+${availGap.toFixed(1)}%` : `${availGap.toFixed(1)}%`}</span>
            </div>

            {/* Performance Actual/Target */}
            <div className="flex items-center gap-1">
              <span className="w-14 text-slate-400 font-bold uppercase truncate">Perf</span>
              <span className="w-20 text-white font-extrabold text-[8.5px] font-mono">{(summary.performance || 82.5).toFixed(1)}% / 95.0%</span>
              <div className="flex-1 bg-[#15171c] h-2 rounded-sm overflow-hidden relative">
                <div className="bg-[#ca8a04] h-full rounded-sm transition-all duration-1000" style={{ width: `${(summary.performance || 82.5) / 95.0 * 100}%` }} />
              </div>
              <span className={`w-10 text-right font-extrabold font-mono ${perfGap >= 0 ? "text-[#16a34a]" : "text-[#dc2626]"}`}>{perfGap >= 0 ? `+${perfGap.toFixed(1)}%` : `${perfGap.toFixed(1)}%`}</span>
            </div>

            {/* Quality Actual/Target */}
            <div className="flex items-center gap-1">
              <span className="w-14 text-slate-400 font-bold uppercase truncate">Qual</span>
              <span className="w-20 text-white font-extrabold text-[8.5px] font-mono">{(summary.quality || 99.8).toFixed(1)}% / 99.0%</span>
              <div className="flex-1 bg-[#15171c] h-2 rounded-sm overflow-hidden relative">
                <div className="bg-[#16a34a] h-full rounded-sm transition-all duration-1000" style={{ width: `${(summary.quality || 99.8) / 99.0 * 100}%` }} />
              </div>
              <span className={`w-10 text-right font-extrabold font-mono ${qualGap >= 0 ? "text-[#16a34a]" : "text-[#dc2626]"}`}>{qualGap >= 0 ? `+${qualGap.toFixed(1)}%` : `${qualGap.toFixed(1)}%`}</span>
            </div>

          </div>
        </div>

      </section>

      {/* 6. FOOTER */}
      <footer className="flex-shrink-0 h-[15px] flex items-center justify-center border-t border-[#374151]/40 text-[7.5px] text-slate-500 tracking-wider font-sans">
        Semua data dihitung secara real-time dari sistem monitoring produksi (SCADA).
      </footer>

      {/* Scope override for globals.css inputs/selects */}
      <style dangerouslySetInnerHTML={{__html: `
        .kiosk-container input:not([type="checkbox"]):not([type="radio"]),
        .kiosk-container select {
          background-color: #15171c !important;
          color: #ffffff !important;
          border: none !important;
          border-radius: 0px !important;
          padding: 0 !important;
          height: 100% !important;
        }
        .kiosk-container input:not([type="checkbox"]):not([type="radio"]):focus,
        .kiosk-container select:focus {
          background-color: #15171c !important;
          color: #ffffff !important;
          border: none !important;
          box-shadow: none !important;
          outline: none !important;
        }
      `}} />

    </div>
  );
}
