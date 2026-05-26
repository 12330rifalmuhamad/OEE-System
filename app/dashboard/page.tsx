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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");
    try {
      let url = "/api/analytics/oee";
      const params = [];
      if (startDate) params.push(`startDate=${startDate}`);
      if (endDate) params.push(`endDate=${endDate}`);
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

  useEffect(() => {
    fetchAnalytics(); // Initial fetch on mount

    const interval = setInterval(() => {
      // Fetch in background quietly
      fetchAnalytics();
    }, 3000);

    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="flex-1 p-6 flex flex-col gap-6 max-w-7xl mx-auto w-full relative z-10 bg-[#141318]">

      {/* 1. SCADA-STYLE HEADER & NAVIGATION TABS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-[#26232b] pb-3">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#f4f3f6] tracking-wider uppercase font-mono flex items-center gap-2">
              <TrendingUp className="w-4.5 h-4.5 text-[#5ebd56]" />
              <span>Telemetry Hub</span>
            </h2>
          </div>

          {/* Active Navigation Tabs from Screenshot */}
          <div className="hidden md:flex items-center gap-6 text-xs font-semibold">
            <div className="border-b-2 border-[#5ebd56] pb-3 text-zinc-100 px-1 cursor-pointer">
              OEE & Downtime
            </div>
            <div className="text-[#8e8b94] pb-3 hover:text-zinc-250 cursor-pointer px-1">
              My Dashboard
            </div>
            <div className="text-[#8e8b94] pb-3 hover:text-zinc-250 cursor-pointer font-bold text-sm px-1">
              +
            </div>
          </div>
        </div>

        {/* Date Filter Panel */}
        <div className="flex flex-wrap items-center gap-2 bg-[#1c1a21] border border-[#26232b] p-1.5 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#8e8b94]" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#121114] border border-[#26232b] p-1 rounded-md text-xs text-[#f4f3f6] focus:outline-none focus:border-[#5ebd56]"
            />
            <span className="text-[#8e8b94] font-bold text-[9px] uppercase font-mono">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#121114] border border-[#26232b] p-1 rounded-md text-xs text-[#f4f3f6] focus:outline-none focus:border-[#5ebd56]"
            />
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-3 py-1 bg-[#5ebd56] hover:bg-[#53a74c] text-black font-extrabold rounded-md text-[10px] font-mono transition-all cursor-pointer"
          >
            Filter
          </button>
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setTimeout(fetchAnalytics, 50);
            }}
            className="p-1 bg-[#121114] border border-[#26232b] text-[#8e8b94] hover:text-[#5ebd56] rounded-md transition-colors cursor-pointer"
            title="Reset Filters"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* 2. DUAL CARD GRID: CONCENTRIC RADIALS & CAPABILITY */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Concentric radial ring card (MATCHING SCREENSHOT PERFECTLY) */}
        <div className="bg-[#1c1a21] border border-[#26232b] rounded-xl p-5 flex flex-col justify-between relative overflow-hidden shadow-lg min-h-[280px]">
          <div className="flex justify-between items-center border-b border-[#26232b] pb-2">
            <div>
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest font-mono flex items-center gap-1.5">
                OEE <span className="text-[#8e8b94] font-normal lowercase">This shift</span>
              </h3>
              <p className="text-[10px] text-[#8e8b94] mt-0.5 font-mono">FBF 1, FBF 2, FBF 3, FBF 4, FBF 5, FBF 6</p>
            </div>
            <MoreHorizontal className="w-4 h-4 text-[#8e8b94] cursor-pointer" />
          </div>

          <div className="flex flex-row items-center justify-around my-4 gap-4">
            {/* Left aligned values with +/- percentage indicators */}
            <div className="flex flex-col gap-4 font-mono">
              <div className="flex flex-col">
                <span className="text-[9px] text-[#8e8b94] uppercase tracking-wider">Availability</span>
                <span className="text-base font-extrabold text-[#5ebd56]">{summary.availability}%</span>
                <span className="text-[9px] text-rose-400 font-semibold">-18%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-[#8e8b94] uppercase tracking-wider">Performance</span>
                <span className="text-base font-extrabold text-[#fed130]">{summary.performance}%</span>
                <span className="text-[9px] text-[#5ebd56] font-semibold">+1%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[9px] text-[#8e8b94] uppercase tracking-wider">Quality</span>
                <span className="text-base font-extrabold text-[#f2a134]">{summary.quality}%</span>
                <span className="text-[9px] text-[#8e8b94] font-semibold">+0%</span>
              </div>
            </div>

            {/* Right: Nested Concentric Gauge Rings */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                {/* 1. Outer Ring: Availability (Radius 66, Circumference 414.7) */}
                <circle cx="80" cy="80" r="66" className="stroke-[#2c2833]" strokeWidth="7.5" fill="transparent" />
                <circle
                  cx="80"
                  cy="80"
                  r="66"
                  className="stroke-[#5ebd56] transition-all duration-1000 ease-out"
                  strokeWidth="7.5"
                  fill="transparent"
                  strokeDasharray={414.7}
                  strokeDashoffset={414.7 - (414.7 * summary.availability) / 100}
                  strokeLinecap="round"
                />

                {/* 2. Middle Ring: Performance (Radius 50, Circumference 314) */}
                <circle cx="80" cy="80" r="50" className="stroke-[#2c2833]" strokeWidth="7.5" fill="transparent" />
                <circle
                  cx="80"
                  cy="80"
                  r="50"
                  className="stroke-[#fed130] transition-all duration-1000 ease-out"
                  strokeWidth="7.5"
                  fill="transparent"
                  strokeDasharray={314}
                  strokeDashoffset={314 - (314 * summary.performance) / 100}
                  strokeLinecap="round"
                />

                {/* 3. Inner Ring: Quality (Radius 34, Circumference 213.6) */}
                <circle cx="80" cy="80" r="34" className="stroke-[#2c2833]" strokeWidth="7.5" fill="transparent" />
                <circle
                  cx="80"
                  cy="80"
                  r="34"
                  className="stroke-[#f2a134] transition-all duration-1000 ease-out"
                  strokeWidth="7.5"
                  fill="transparent"
                  strokeDasharray={213.6}
                  strokeDashoffset={213.6 - (213.6 * summary.quality) / 100}
                  strokeLinecap="round"
                />
              </svg>

              {/* Centered OEE Text in nested circles */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold font-mono text-[#f4f3f6] tracking-tighter">{summary.oee}%</span>
                <span className="text-[8px] text-[#8e8b94] font-bold tracking-widest uppercase font-mono mt-0.5">OEE</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center text-[9px] text-[#8e8b94] border-t border-[#26232b] pt-2">
            <span>Overall capability: <span className="text-[#5ebd56] font-semibold">Operational</span></span>
            <span>Target: <span className="text-[#5ebd56] font-semibold font-mono">85.0%</span></span>
          </div>
        </div>

        {/* Machine Capability Matrix (Right Side Card) */}
        <div className="bg-[#1c1a21] border border-[#26232b] rounded-xl p-5 shadow-lg min-h-[280px] flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-[#26232b] pb-2">
            <div>
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest font-mono">Line Machine Matrix</h3>
              <p className="text-[10px] text-[#8e8b94] mt-0.5 font-mono">Active plant capabilities.</p>
            </div>
            <MoreHorizontal className="w-4 h-4 text-[#8e8b94] cursor-pointer" />
          </div>

          <div className="overflow-x-auto my-3 flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[#26232b] text-[#8e8b94] font-semibold uppercase tracking-wider">
                  <th className="py-2">Line</th>
                  <th className="py-2 text-right font-mono">AR</th>
                  <th className="py-2 text-right font-mono">PR</th>
                  <th className="py-2 text-right font-mono">QR</th>
                  <th className="py-2 text-right font-mono">OEE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26232b] text-zinc-300">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#8e8b94] italic font-mono">
                      Fetching line parameters...
                    </td>
                  </tr>
                ) : machines.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-[#8e8b94] italic font-mono">
                      No machinery registered.
                    </td>
                  </tr>
                ) : (
                  machines.map((m) => (
                    <tr key={m.id} className="hover:bg-[#232029]/20 transition-colors">
                      <td className="py-2.5 font-semibold text-zinc-200 flex items-center gap-2 font-mono">
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
      </div>

      {/* 3. SPREADSHEET FORMULA VALIDATION PANEL */}
      <div className="bg-[#1c1a21] border border-[#26232b] rounded-xl p-5 shadow-lg">
        <div className="border-b border-[#26232b] pb-2 mb-4">
          <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-widest font-mono flex items-center gap-2">
            <Calculator className="w-4.5 h-4.5 text-[#5ebd56]" />
            <span>Master Formula Telemetry Validation</span>
          </h3>
          <p className="text-[10px] text-[#8e8b94] mt-0.5 font-mono">
            Explicit distribution of plant production time calculated precisely under the master spreadsheet mathematical rules.
          </p>
        </div>

        {/* 6-Step Visual Timeline of Time Allocations */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 font-mono">
          <div className="bg-[#141318] border border-[#26232b] rounded-lg p-3">
            <span className="text-[9px] font-bold text-[#8e8b94] uppercase tracking-wider">Loading Time</span>
            <div className="text-sm font-bold text-zinc-200 mt-1">{summary.loadingTime} <span className="text-[10px] text-[#8e8b94]">min</span></div>
            <p className="text-[9px] text-[#8e8b94] mt-1.5 leading-normal">Total Shift Time</p>
          </div>

          <div className="bg-[#141318] border border-[#26232b] rounded-lg p-3">
            <span className="text-[9px] font-bold text-[#5ebd56] uppercase tracking-wider">Operating Time</span>
            <div className="text-sm font-bold text-[#5ebd56] mt-1">{summary.operatingTime} <span className="text-[10px] text-[#8e8b94]">min</span></div>
            <p className="text-[9px] text-[#8e8b94] mt-1.5 leading-normal">Loading - Down - MI</p>
          </div>

          <div className="bg-[#141318] border border-[#26232b] rounded-lg p-3">
            <span className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">Performance Loss</span>
            <div className="text-sm font-bold text-rose-400 mt-1">{summary.performanceLoss} <span className="text-[10px] text-[#8e8b94]">min</span></div>
            <p className="text-[9px] text-[#8e8b94] mt-1.5 leading-normal">Cycle Deficit</p>
          </div>

          <div className="bg-[#141318] border border-[#26232b] rounded-lg p-3">
            <span className="text-[9px] font-bold text-zinc-200 uppercase tracking-wider">Net Operating</span>
            <div className="text-sm font-bold text-zinc-200 mt-1">{summary.netOperatingTime} <span className="text-[10px] text-[#8e8b94]">min</span></div>
            <p className="text-[9px] text-[#8e8b94] mt-1.5 leading-normal">Output / Std Speed</p>
          </div>

          <div className="bg-[#141318] border border-[#26232b] rounded-lg p-3">
            <span className="text-[9px] font-bold text-[#fed130] uppercase tracking-wider">Defect Loss</span>
            <div className="text-sm font-bold text-[#fed130] mt-1">{summary.defectLoss} <span className="text-[10px] text-[#8e8b94]">min</span></div>
            <p className="text-[9px] text-[#8e8b94] mt-1.5 leading-normal">(Reject)/Speed</p>
          </div>

          <div className="bg-[#141318] border border-[#26232b] rounded-lg p-3">
            <span className="text-[9px] font-bold text-[#f2a134] uppercase tracking-wider">Valued Operating</span>
            <div className="text-sm font-bold text-[#f2a134] mt-1">{summary.valuedOperatingTime} <span className="text-[10px] text-[#8e8b94]">min</span></div>
            <p className="text-[9px] text-[#8e8b94] mt-1.5 leading-normal">Net - Defect Time</p>
          </div>
        </div>
      </div>

      {/* 4. DUAL COLUMN PARETO DOWNTIME & TRENDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Pareto Downtime chart - 100% Matching Screenshot Colors and Arrows */}
        <div className="bg-[#1c1a21] border border-[#26232b] rounded-xl p-5 shadow-lg flex flex-col justify-between min-h-[300px]">
          <div className="flex justify-between items-center border-b border-[#26232b] pb-2">
            <div>
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest font-mono">Downtime Pareto Chart (Lost Time)</h3>
              <p className="text-[10px] text-[#8e8b94] mt-0.5 font-mono">Total minutes categorized precisely by Pareto ranks.</p>
            </div>
            <MoreHorizontal className="w-4 h-4 text-[#8e8b94] cursor-pointer" />
          </div>

          <div className="flex-1 flex flex-col gap-3.5 justify-center font-mono my-4">
            {loading ? (
              <div className="flex-1 flex items-center justify-center text-[#8e8b94] text-xs italic">
                Loading downtime logs...
              </div>
            ) : pareto.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-[#8e8b94] text-xs italic">
                No recorded downtime.
              </div>
            ) : (
              pareto.map((item, index) => {
                const percentOfTotal = totalLostMinutes > 0 ? (item.minutes / totalLostMinutes) * 100 : 0;
                return (
                  <div key={item.code} className="flex flex-col gap-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-zinc-200">
                        [{item.code.toUpperCase()}] {item.name}
                      </span>
                      <span className="font-bold text-zinc-300">
                        {item.minutes}m <span className="text-[10px] text-[#8e8b94] font-medium">({percentOfTotal.toFixed(1)}%)</span>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-[#141318] h-3.5 rounded-md overflow-hidden border border-[#26232b]">
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

        {/* OKP OEE Trend Analysis */}
        <div className="bg-[#1c1a21] border border-[#26232b] rounded-xl p-5 shadow-lg flex flex-col justify-between min-h-[300px]">
          <div className="flex justify-between items-center border-b border-[#26232b] pb-2">
            <div>
              <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest font-mono">OKP OEE Trend Logs</h3>
              <p className="text-[10px] text-[#8e8b94] mt-0.5 font-mono">Historical sequence of recent production runs.</p>
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
          <div className="flex items-center gap-4 overflow-x-auto py-6 pl-2 scrollbar-thin flex-1 my-auto">
            {loading ? (
              <div className="text-[#8e8b94] text-xs italic font-mono">Mapping trend...</div>
            ) : timeline.length === 0 ? (
              <div className="text-[#8e8b94] text-xs italic font-mono">No historical trend logs.</div>
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
                    <span className="font-mono text-[9px] font-bold text-zinc-300 mt-1">{item.okpNumber}</span>
                    <span className="text-[8px] text-[#8e8b94]">{item.date}</span>
                  </div>
                  {idx < timeline.length - 1 && <div className="w-8 h-[1px] bg-[#26232b]" />}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
