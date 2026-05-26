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
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full bg-[#141318] text-[#f4f3f6]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#26232b] pb-5">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2.5 font-mono">
            <ClipboardList className="w-5 h-5 text-[#5ebd56]" />
            OKP Production Logs
          </h2>
          <p className="text-xs text-[#8e8b94] mt-1 font-mono">Daftar riwayat transaksi kerja harian, loading time, dan output per mesin.</p>
        </div>
        <Link
          href="/dashboard/transactions/create"
          className="flex items-center gap-2 px-4 py-2 bg-[#5ebd56] hover:bg-[#53a74c] text-black font-extrabold rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-[0_2px_8px_rgba(94,189,86,0.1)]"
        >
          <Plus className="w-3.5 h-3.5" />
          New OKP Entry
        </Link>
      </div>

      {/* Main Container */}
      <div className="bg-[#1c1a21] border border-[#26232b] rounded-xl overflow-hidden shadow-lg">
        {/* Table header utility */}
        <div className="flex justify-between items-center bg-[#1c1a21] p-4 border-b border-[#26232b]">
          <span className="text-xs font-bold text-[#8e8b94] uppercase tracking-wider font-mono">Total Logs Indexed: {logs.length}</span>
          <button
            onClick={fetchLogs}
            className="p-1.5 bg-[#121114] hover:bg-zinc-800 border border-[#26232b] rounded text-[#8e8b94] hover:text-zinc-200 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1c1a21] border-b border-[#26232b] text-[#8e8b94] font-semibold uppercase tracking-wider font-mono">
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
            <tbody className="divide-y divide-[#26232b] text-zinc-300 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8e8b94] italic">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#5ebd56] mb-2" />
                    Memuat catatan transaksi...
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-rose-400 font-semibold font-sans">
                    {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#8e8b94] italic font-sans font-medium">
                    Belum ada transaksi OKP yang dicatat. Klik &quot;New OKP Entry&quot; untuk memulai.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-[#232029]/20 transition-all">
                    <td className="py-4 px-6 text-center text-[#8e8b94] font-semibold">{idx + 1}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-100 flex items-center gap-1.5 font-sans">
                          <Calendar className="w-3.5 h-3.5 text-zinc-550" />
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
                    <td className="py-4 px-6 font-mono text-xs font-bold text-zinc-100">{log.okpNumber}</td>
                    <td className="py-4 px-6">
                      <span className="flex items-center gap-1.5 text-zinc-300 font-sans">
                        <Cpu className="w-3.5 h-3.5 text-zinc-550" />
                        {log.machine.name}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-sans">
                      <div className="flex flex-col">
                        <span className="font-semibold text-zinc-200">{log.product.name}</span>
                        {log.product.productCode && (
                          <span className="text-[10px] text-zinc-550 font-mono mt-0.5">
                            {log.product.productCode}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right text-zinc-400 font-mono">
                      {log.loadingTime} <span className="text-[10px] text-[#8e8b94]">mins</span>
                    </td>
                    <td className="py-4 px-6 text-right text-zinc-100 font-bold font-mono">
                      {log.totalOutput.toLocaleString("id-ID")} <span className="text-[10px] text-[#8e8b94]">CB</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex items-center justify-center gap-3 font-sans">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#5ebd56]/10 text-[#5ebd56] text-xs font-bold rounded-full border border-[#5ebd56]/20 font-sans" title="Total Logs">
                          <Layers className="w-3 h-3" />
                          {log._count.activities}
                        </span>
                        <Link
                          href={`/dashboard/transactions/${log.id}/adjust`}
                          className="px-2.5 py-1 bg-[#1c1a21] hover:bg-zinc-800 text-[#5ebd56] hover:text-emerald-400 font-bold rounded border border-[#26232b] text-[10px] uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                        >
                          <Edit3 className="w-3 h-3" />
                          <span>Adjust</span>
                        </Link>
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
