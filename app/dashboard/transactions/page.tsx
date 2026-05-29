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
  machine: { name: string };
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



  const fetchLogs = async () => {
    setLoading(true);
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
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(); // Initial fetch on mount

    const interval = setInterval(() => {
      fetchLogs();
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
        {hasMounted && currentUser && (
          <Link
            href="/dashboard/transactions/create"
            className="flex items-center gap-2 px-4 py-2 bg-[#5ebd56] hover:bg-[#53a74c] text-black font-extrabold rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-[0_2px_8px_rgba(94,189,86,0.1)]"
          >
            <Plus className="w-3.5 h-3.5" />
            New OKP Entry
          </Link>
        )}
      </div>

      {/* Main Container */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-[var(--card-shadow)]">
        {/* Table header utility */}
        <div className="flex justify-between items-center bg-[var(--bg-card)] p-4 border-b border-[var(--border-color)]">
          <span className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider font-mono">Total Logs Indexed: {logs.length}</span>
          <button
            onClick={fetchLogs}
            className="p-1.5 bg-[var(--bg-input)] hover:bg-[var(--hover-bg)]/80 border border-[var(--border-color)] rounded text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--bg-card)] border-b border-[var(--border-color)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider font-mono">
                <th className="py-4 px-6 text-center w-16">No</th>
                <th className="py-4 px-6">Date & Shift</th>
                <th className="py-4 px-6">OKP Number</th>
                <th className="py-4 px-6">Production Line</th>
                <th className="py-4 px-6">Active Product</th>
                <th className="py-4 px-6 text-right">Loading Time</th>
                <th className="py-4 px-6 text-right">FG Output</th>
                <th className="py-4 px-6 text-center">Logs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)] font-mono">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--text-secondary)] italic">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#5ebd56] mb-2" />
                    Memuat catatan transaksi...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-rose-500 font-semibold font-sans">
                    {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[var(--text-secondary)] italic font-sans font-medium">
                    Belum ada transaksi OKP yang dicatat. {hasMounted && currentUser ? 'Klik "New OKP Entry" untuk memulai.' : 'Silakan login untuk mencatat OKP.'}
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-[var(--hover-bg)]/20 transition-all">
                    <td className="py-4 px-6 text-center text-[var(--text-secondary)] font-semibold">{idx + 1}</td>
                    <td className="py-4 px-6">
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
                    <td className="py-4 px-6 font-mono text-xs font-bold text-[var(--text-primary)]">{log.okpNumber}</td>
                    <td className="py-4 px-6">
                      <span className="flex items-center gap-1.5 text-[var(--text-primary)] font-sans">
                        <Cpu className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                        {log.machine.name}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-sans">
                      <div className="flex flex-col animate-fadeIn">
                        <span className="font-semibold text-[var(--text-primary)]">{log.product.name}</span>
                        {log.product.productCode && (
                          <span className="text-[10px] text-[var(--text-secondary)] font-mono mt-0.5">
                            {log.product.productCode}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right text-[var(--text-primary)] font-mono">
                      {log.loadingTime} <span className="text-[10px] text-[var(--text-secondary)]">mins</span>
                    </td>
                    <td className="py-4 px-6 text-right text-[var(--text-primary)] font-bold font-mono">
                      {log.totalOutput.toLocaleString("id-ID")} <span className="text-[10px] text-[var(--text-secondary)]">CB</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-3 font-sans">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#5ebd56]/10 text-[#5ebd56] text-xs font-bold rounded-full border border-[#5ebd56]/20 font-sans" title="Total Logs">
                          <Layers className="w-3 h-3" />
                          {log._count.activities}
                        </span>
                        {hasMounted && currentUser ? (
                          <Link
                            href={`/dashboard/transactions/${log.id}/adjust`}
                            className="px-2.5 py-1 bg-[var(--bg-input)] hover:bg-[var(--hover-bg)] text-[#5ebd56] hover:text-emerald-500 font-bold rounded border border-[var(--border-color)] text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>Adjust</span>
                          </Link>
                        ) : (
                          <span className="px-2 py-1 text-[9px] text-[var(--text-secondary)] font-bold border border-dashed border-[var(--border-color)] rounded uppercase tracking-wider select-none bg-[var(--bg-input)]/30">
                            Read-Only
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

