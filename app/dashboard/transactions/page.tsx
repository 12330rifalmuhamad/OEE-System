"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, RefreshCw, ClipboardList, Calendar, Cpu, Layers, Edit3 } from "lucide-react";

interface OKPLog {
  id: string;
  okpNumber: string;
  date: string;
  shift: number;
  loadingTime: number;
  totalOutput: number;
  rework: number;
  reject: number;
  downtime: number;
  mi: number;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
  machine: { name: string; lineProcess?: { name: string } | null };
  product: { name: string; productCode: string | null };
  _count: { activities: number };
}

export default function OKPTransactionsPage() {
  const [logs, setLogs] = useState<OKPLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasMounted, setHasMounted] = useState(false);

  // Check current user status on mount
  useEffect(() => {
    setHasMounted(true);
    async function checkUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        }
      } catch (err) {
        console.error("Gagal memeriksa user:", err);
      }
    }
    checkUser();
  }, []);



  const fetchLogs = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/transactions/okp");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.okpLogs);
      } else {
        const data = await res.json();
        setError(data.error || "Gagal memuat transaksi OKP.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server.");
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(false); // Initial load with spinner

    const interval = setInterval(() => {
      fetchLogs(true); // Quiet update in background every 3 seconds
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full bg-[var(--bg-base)] text-[var(--text-primary)] transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border-color)] pb-5">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5 font-mono">
            <ClipboardList className="w-5 h-5 text-[#5ebd56]" />
            OKP Production Logs
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">Daftar riwayat transaksi kerja harian, loading time, dan output per mesin.</p>
        </div>
        {/* Automatisasi: OKP dibuat otomatis dari mesin/sistem luar */}
      </div>

      {/* Main Container */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-[var(--card-shadow)]">
        {/* Table header utility */}
        <div className="flex justify-between items-center bg-[var(--bg-card)] p-4 border-b border-[var(--border-color)]">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">Total Logs Indexed: {logs.length}</span>
          <button
            onClick={() => fetchLogs(false)}
            className="p-1.5 bg-[var(--bg-input)] hover:bg-[var(--hover-bg)]/80 border border-[var(--border-color)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--bg-card)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider font-mono">
                <th className="py-3 px-3 text-center w-12">No</th>
                <th className="py-3 px-3 min-w-[100px]">Date & Shift</th>
                <th className="py-3 px-3">OKP Number</th>
                <th className="py-3 px-3">Production Line</th>
                <th className="py-3 px-3 min-w-[120px]">Active Product</th>
                <th className="py-3 px-3 text-right">Loading</th>
                <th className="py-3 px-3 text-right">Downtime</th>
                <th className="py-3 px-3 text-right">FG Output</th>
                <th className="py-3 px-3 text-right">Rework</th>
                <th className="py-3 px-3 text-right">Reject</th>
                <th className="py-3 px-3 text-right font-bold text-[#5ebd56]">AR</th>
                <th className="py-3 px-3 text-right font-bold text-[#fed130]">PR</th>
                <th className="py-3 px-3 text-right font-bold text-[#f2a134]">QR</th>
                <th className="py-3 px-3 text-right font-bold">OEE</th>
                <th className="py-3 px-3 text-center min-w-[160px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)] font-mono">
              {loading ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-[var(--text-secondary)] italic">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#5ebd56] mb-2" />
                    Memuat catatan transaksi...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-rose-500 font-semibold font-sans">
                    {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={15} className="py-12 text-center text-[var(--text-secondary)] italic font-sans font-medium">
                    Belum ada transaksi OKP yang tersinkronisasi dari sistem mesin/ERP.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-[var(--hover-bg)]/20 transition-all">
                    <td className="py-3.5 px-3 text-center text-[var(--text-secondary)] font-semibold">{idx + 1}</td>
                    <td className="py-3.5 px-3">
                      <div className="flex flex-col animate-fadeIn">
                        <span className="font-semibold text-[var(--text-primary)] flex items-center gap-1.5 font-sans">
                          <Calendar className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                          {new Date(log.date).toLocaleDateString("id-ID", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                        <span className="text-[10px] font-bold text-[#5ebd56] mt-0.5 uppercase tracking-wide">
                          Shift {log.shift}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-3 font-mono text-xs font-bold text-[var(--text-primary)]">{log.okpNumber}</td>
                    <td className="py-3.5 px-3">
                      <span className="flex items-center gap-1.5 text-[var(--text-primary)] font-sans">
                        <Cpu className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                        {log.machine.lineProcess?.name || log.machine.name}
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-sans">
                      <div className="flex flex-col animate-fadeIn">
                        <span className="font-semibold text-[var(--text-primary)]">{log.product.name}</span>
                        {log.product.productCode && (
                          <span className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">
                            {log.product.productCode}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-3 text-right text-[var(--text-primary)] font-mono">
                      {log.loadingTime} <span className="text-[9px] text-[var(--text-secondary)]">m</span>
                    </td>
                    <td className="py-3.5 px-3 text-right text-[var(--text-primary)] font-mono">
                      {log.downtime !== undefined ? log.downtime : 0} <span className="text-[9px] text-[var(--text-secondary)]">m</span>
                    </td>
                    <td className="py-3.5 px-3 text-right text-[var(--text-primary)] font-bold font-mono">
                      {log.totalOutput.toLocaleString("id-ID")} <span className="text-[9px] text-[var(--text-secondary)]">CB</span>
                    </td>
                    <td className="py-3.5 px-3 text-right text-[var(--text-primary)] font-mono">
                      {log.rework !== undefined ? log.rework : 0} <span className="text-[9px] text-[var(--text-secondary)]">Kg</span>
                    </td>
                    <td className="py-3.5 px-3 text-right text-[var(--text-primary)] font-mono">
                      {log.reject !== undefined ? log.reject : 0} <span className="text-[9px] text-[var(--text-secondary)]">Kg</span>
                    </td>
                    <td className="py-3.5 px-3 text-right text-[#5ebd56] font-bold font-mono">
                      {log.availability !== undefined ? log.availability : 0}%
                    </td>
                    <td className="py-3.5 px-3 text-right text-[#fed130] font-bold font-mono">
                      {log.performance !== undefined ? log.performance : 0}%
                    </td>
                    <td className="py-3.5 px-3 text-right text-[#f2a134] font-bold font-mono">
                      {log.quality !== undefined ? log.quality : 0}%
                    </td>
                    <td className={`py-3.5 px-3 text-right font-extrabold font-mono ${
                      (log.oee || 0) >= 85 ? "text-[#5ebd56]" : (log.oee || 0) >= 70 ? "text-[#fed130]" : "text-rose-400"
                    }`}>
                      {log.oee !== undefined ? log.oee : 0}%
                    </td>
                    <td className="py-3.5 px-3 text-center">
                      <div className="flex items-center justify-center gap-2 font-sans">
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-[#5ebd56]/10 text-[#5ebd56] text-[10px] font-bold rounded-full border border-[#5ebd56]/20 font-sans" title="Total Logs">
                          <Layers className="w-2.5 h-2.5" />
                          {log._count.activities}
                        </span>
                        {hasMounted && currentUser ? (
                          <div className="flex gap-1">
                            <Link
                              href={`/dashboard/transactions/${log.id}/edit`}
                              className="px-2 py-0.5 bg-[var(--bg-input)] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] hover:text-[#5ebd56] font-bold rounded border border-[var(--border-color)] text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-1"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Edit</span>
                            </Link>
                            <Link
                              href={`/dashboard/transactions/${log.id}/adjust`}
                              className="px-2 py-0.5 bg-[var(--bg-input)] hover:bg-[var(--hover-bg)] text-[#5ebd56] hover:text-emerald-500 font-bold rounded border border-[var(--border-color)] text-[9px] uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-1"
                            >
                              <Edit3 className="w-2.5 h-2.5" />
                              <span>Adjust</span>
                            </Link>
                          </div>
                        ) : (
                          <span className="px-1.5 py-0.5 text-[8px] text-[var(--text-secondary)] font-bold border border-dashed border-[var(--border-color)] rounded uppercase tracking-wider select-none bg-[var(--bg-input)]/30">
                            R-Only
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

