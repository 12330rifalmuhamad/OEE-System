"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart3,
  Calendar,
  RefreshCw,
  AlertTriangle,
  Clock,
  TrendingDown,
  Percent,
  Search,
  Filter,
} from "lucide-react";

interface ParetoData {
  code: string;
  name: string;
  minutes: number;
  count: number;
}

export default function ParetoAnalyticsPage() {
  const [pareto, setPareto] = useState<ParetoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Filter states
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchPareto = async () => {
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
        setPareto(data.pareto || []);
      } else {
        setError("Gagal memuat data Pareto.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPareto();
  }, []);

  const totalLostMinutes = pareto.reduce((sum, item) => sum + item.minutes, 0);
  const totalStopsCount = pareto.reduce((sum, item) => sum + item.count, 0);

  // Filter based on search query
  const filteredPareto = pareto.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full bg-[var(--bg-base)] text-[var(--text-primary)] transition-colors duration-200">
      
      {/* 1. HEADER PANEL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border-color)] pb-5">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5 font-mono">
            <div className="p-1.5 bg-[var(--bg-input)] rounded-lg border border-[var(--border-color)] text-[#5ebd56]">
              <BarChart3 className="w-5 h-5" />
            </div>
            <span>Pareto Stop Time Analytics</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">Mengaudit frekuensi breakdown dan waktu henti berdasarkan kontribusi downtime terbesar.</p>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center gap-2 bg-[var(--bg-card)] border border-[var(--border-color)] p-1.5 rounded-lg text-xs font-mono shadow-[var(--card-shadow)]">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[var(--bg-input)] border border-[var(--border-color)] p-1 rounded text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#5ebd56]"
            />
            <span className="text-[var(--text-secondary)] font-bold text-[9px]">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[var(--bg-input)] border border-[var(--border-color)] p-1 rounded text-xs text-[var(--text-primary)] focus:outline-none focus:border-[#5ebd56]"
            />
          </div>
          <button
            onClick={fetchPareto}
            className="px-3 py-1 bg-[#5ebd56] hover:bg-[#53a74c] text-black font-extrabold rounded text-[10px] cursor-pointer font-bold uppercase tracking-wider"
          >
            Apply
          </button>
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
              setTimeout(fetchPareto, 50);
            }}
            className="p-1 bg-[var(--bg-input)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[#5ebd56] rounded transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-550/10 border border-rose-500/20 text-rose-500 p-4 rounded-lg text-xs font-semibold flex items-center gap-2 font-mono">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* 2. OVERALL ANALYTICS COUNTERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Total lost time */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-[var(--card-shadow)] flex flex-col justify-between min-h-[110px] transition-all">
          <div className="flex justify-between items-start text-[var(--text-secondary)] text-[10px] font-bold tracking-wider uppercase font-mono">
            <span>Total Lost Duration</span>
            <Clock className="w-4 h-4 text-[#e05e52]" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-extrabold font-mono text-[var(--text-primary)]">{totalLostMinutes}</span>
            <span className="text-xs text-[var(--text-secondary)] ml-1 font-mono">minutes</span>
          </div>
          <p className="text-[9px] text-[var(--text-secondary)] font-mono leading-normal">
            Akumulasi seluruh waktu breakdown dan setup line.
          </p>
        </div>

        {/* Total frequency count */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-[var(--card-shadow)] flex flex-col justify-between min-h-[110px] transition-all">
          <div className="flex justify-between items-start text-[var(--text-secondary)] text-[10px] font-bold tracking-wider uppercase font-mono">
            <span>Stop Frequency</span>
            <TrendingDown className="w-4 h-4 text-[#ffd54f]" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-extrabold font-mono text-[var(--text-primary)]">{totalStopsCount}</span>
            <span className="text-xs text-[var(--text-secondary)] ml-1 font-mono">incidents</span>
          </div>
          <p className="text-[9px] text-[var(--text-secondary)] font-mono leading-normal">
            Banyaknya pemberhentian proses dalam rentang tanggal filter.
          </p>
        </div>

        {/* average MTTR */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-[var(--card-shadow)] flex flex-col justify-between min-h-[110px] transition-all">
          <div className="flex justify-between items-start text-[var(--text-secondary)] text-[10px] font-bold tracking-wider uppercase font-mono">
            <span>Mean Time To Restore (MTTR)</span>
            <Percent className="w-4 h-4 text-[#4db6ac]" />
          </div>
          <div className="my-2">
            <span className="text-2xl font-extrabold font-mono text-[var(--text-primary)]">
              {totalStopsCount > 0 ? (totalLostMinutes / totalStopsCount).toFixed(1) : 0}
            </span>
            <span className="text-xs text-[var(--text-secondary)] ml-1 font-mono">min / stop</span>
          </div>
          <p className="text-[9px] text-[var(--text-secondary)] font-mono leading-normal">
            Rata-rata durasi penanganan per satu kali henti proses.
          </p>
        </div>

      </div>

      {/* 3. DOWNTIME LISTING TABLE */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-[var(--card-shadow)] flex flex-col gap-4 transition-all">
        
        {/* Search bar and title */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 border-b border-[var(--border-color)] pb-3">
          <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest font-mono">
            Breakdown Analysis Directory
          </h3>
          <div className="relative w-full sm:max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" />
            <input
              type="text"
              placeholder="Search category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg py-1.5 pl-8 pr-3.5 text-xs text-[var(--text-primary)] placeholder-zinc-500 focus:outline-none focus:border-[#5ebd56] font-mono"
            />
          </div>
        </div>

        {/* Pareto Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border-color)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider font-mono">
                <th className="py-2.5">Code</th>
                <th className="py-2.5">Downtime Loss Category</th>
                <th className="py-2.5 text-right font-mono">Frequency</th>
                <th className="py-2.5 text-right font-mono">Total Duration</th>
                <th className="py-2.5 text-right font-mono">Impact Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)] font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--text-secondary)] italic">
                    Memuat data Pareto...
                  </td>
                </tr>
              ) : filteredPareto.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[var(--text-secondary)] italic">
                    Tidak ada riwayat downtime terekam dalam filter.
                  </td>
                </tr>
              ) : (
                filteredPareto.map((item, idx) => {
                  const percentOfTotal = totalLostMinutes > 0 ? (item.minutes / totalLostMinutes) * 100 : 0;
                  return (
                    <tr key={item.code} className="hover:bg-[var(--hover-bg)]/20 transition-colors">
                      <td className="py-3 font-bold text-[#5ebd56]">
                        {item.code.toUpperCase()}
                      </td>
                      <td className="py-3 text-[var(--text-primary)] font-sans font-semibold">
                        {item.name}
                      </td>
                      <td className="py-3 text-right text-[var(--text-secondary)]">
                        {item.count} stops
                      </td>
                      <td className="py-3 text-right font-extrabold text-[var(--text-primary)]">
                        {item.minutes} min
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <span className="text-[var(--text-secondary)] font-bold">{percentOfTotal.toFixed(1)}%</span>
                          <div className="w-16 bg-[var(--bg-base)] h-1.5 rounded-full overflow-hidden border border-[var(--border-color)]">
                            <div
                              className="bg-[#5ebd56] h-full rounded-full"
                              style={{ width: `${percentOfTotal}%` }}
                            />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

    </div>
  );
}
