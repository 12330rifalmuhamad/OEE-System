"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, AlertTriangle, ShieldCheck, Cpu, Clock, HelpCircle, Edit3 } from "lucide-react";

interface ActivityCategory {
  id: number;
  code: string;
  name: string;
}

interface ActivityCode {
  id: number;
  code: string;
  fullDescription: string;
  category: ActivityCategory;
}

interface ActivityLog {
  id: number;
  activityCodeId: number;
  duration: number;
  startTime: string | null;
  endTime: string | null;
  brRootCause: string | null;
  activityCode: ActivityCode;
}

interface OKPLog {
  id: number;
  okpNumber: string;
  date: string;
  shift: number;
  machine: { name: string };
  product: { name: string; standarSpeed: number };
  activities: ActivityLog[];
}

export default function AdjustActivityPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  const [okpLog, setOkpLog] = useState<OKPLog | null>(null);
  const [activityCodes, setActivityCodes] = useState<ActivityCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Local state for row adjustments
  const [rowStates, setRowStates] = useState<
    Record<number, { activityCodeId: string; reason: string; isSubmitting: boolean }>
  >({});

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg("");
    try {
      const [resLog, resCodes] = await Promise.all([
        fetch(`/api/transactions/okp/${id}`),
        fetch("/api/master/activity-codes"),
      ]);

      if (resLog.ok && resCodes.ok) {
        const dataLog = await resLog.json();
        const dataCodes = await resCodes.json();

        setOkpLog(dataLog.okpLog);
        setActivityCodes(dataCodes.activityCodes);

        // Prepopulate row adjustment states
        const initialStates: typeof rowStates = {};
        dataLog.okpLog.activities.forEach((act: ActivityLog) => {
          initialStates[act.id] = {
            activityCodeId: String(act.activityCodeId),
            reason: act.brRootCause || "",
            isSubmitting: false,
          };
        });
        setRowStates(initialStates);
      } else {
        setErrorMsg("Gagal mengambil data log transaksi atau kode master.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Kesalahan koneksi ke server database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const handleRowChange = (actId: number, key: "activityCodeId" | "reason", val: string) => {
    setRowStates((prev) => ({
      ...prev,
      [actId]: {
        ...prev[actId],
        [key]: val,
      },
    }));
  };

  const handleAdjustRow = async (actId: number) => {
    setErrorMsg("");
    setSuccessMsg("");

    const targetRow = rowStates[actId];
    if (!targetRow.activityCodeId) {
      setErrorMsg("Harap pilih Kode Aktivitas penyesuaian.");
      return;
    }

    // Set row submitting state
    setRowStates((prev) => ({
      ...prev,
      [actId]: { ...prev[actId], isSubmitting: true },
    }));

    try {
      const res = await fetch(`/api/transactions/activity-logs/${actId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityCodeId: parseInt(targetRow.activityCodeId, 10),
          brRootCause: targetRow.reason,
        }),
      });

      if (res.ok) {
        setSuccessMsg("Catatan aktivitas berhasil disesuaikan secara permanen!");
        // Refresh local data to reflect database state
        await fetchData();
      } else {
        const data = await res.json();
        setErrorMsg(data.error || "Gagal menyesuaikan data aktivitas.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Kesalahan koneksi saat menyimpan penyesuaian.");
    } finally {
      setRowStates((prev) => ({
        ...prev,
        [actId]: { ...prev[actId], isSubmitting: false },
      }));
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-[#141318] text-[#8e8b94] font-mono py-20">
        <div className="flex flex-col items-center gap-3">
          <Clock className="w-8 h-8 text-[#5ebd56] animate-spin" />
          <span>Memuat detail aktivitas transaksi OEE...</span>
        </div>
      </div>
    );
  }

  if (!okpLog) {
    return (
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full bg-[#141318] text-[#f4f3f6]">
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3 font-mono">
          <AlertTriangle className="w-5 h-5" />
          <span>Detail transaksi tidak ditemukan atau Anda tidak terautentikasi.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full bg-[#141318] text-[#f4f3f6] relative z-10">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#26232b] pb-5">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/transactions"
            className="p-2 bg-[#1c1a21] hover:bg-zinc-800 border border-[#26232b] rounded-lg text-[#8e8b94] hover:text-zinc-200 transition-all"
            title="Kembali ke Daftar Transaksi"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-zinc-100 font-mono tracking-tight flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#5ebd56]" />
              Downtime Data Adjuster
            </h2>
            <p className="text-xs text-[#8e8b94] mt-1 font-mono">
              OEE System (Stage 1. Input & Manual Reconcile) untuk OKP:{" "}
              <span className="text-[#5ebd56] font-extrabold">{okpLog.okpNumber}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-[#1c1a21] border border-[#26232b] px-4 py-2 rounded-lg font-mono text-xs">
          <div className="flex items-center gap-1.5 border-r border-[#26232b] pr-3">
            <Cpu className="w-4.5 h-4.5 text-[#5ebd56]" />
            <span className="text-zinc-200">{okpLog.machine.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4.5 h-4.5 text-[#fed130]" />
            <span className="text-zinc-200">Shift {okpLog.shift}</span>
          </div>
        </div>
      </div>

      {/* STATUS ALERTS */}
      {errorMsg && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4.5 h-4.5 flex-shrink-0" />
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4.5 h-4.5 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* DOUBLE-BOARD LAYOUT CONTAINER */}
      <div className="bg-[#1c1a21] border border-[#26232b] rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#141318]/50 border-b border-[#26232b] text-[#8e8b94] font-semibold uppercase tracking-wider font-mono">
                {/* LEFT SIDE: Automatic Record by System */}
                <th className="py-4 px-5 border-r border-[#26232b] w-1/2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[#8e8b94]" />
                    <span className="text-[#8e8b94]">Automatic Record Data by System</span>
                    <span className="text-[10px] ml-auto bg-zinc-800 text-zinc-400 px-2 py-0.5 rounded font-normal font-sans uppercase">Read Only</span>
                  </div>
                </th>
                
                {/* MIDDLE ARROW COLUMN */}
                <th className="py-4 px-2 text-center w-12 border-r border-[#26232b] bg-[#141318]/70">
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-[#8e8b94]" />
                  </div>
                </th>

                {/* RIGHT SIDE: Manual Adjust Data by System */}
                <th className="py-4 px-5 w-1/2">
                  <div className="flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-[#5ebd56]" />
                    <span className="text-[#5ebd56]">Manual Adjust Data by System</span>
                    <span className="text-[10px] ml-auto bg-emerald-500/10 text-[#5ebd56] px-2 py-0.5 rounded font-normal font-sans uppercase border border-[#5ebd56]/20">Active</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26232b] font-mono">
              {okpLog.activities.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-[#8e8b94] italic font-sans">
                    Belum ada data aktivitas atau downtime yang terekam pada OKP ini.
                  </td>
                </tr>
              ) : (
                okpLog.activities.map((act) => {
                  const state = rowStates[act.id] || { activityCodeId: "", reason: "", isSubmitting: false };
                  const isBreakdown = act.activityCode.category.code === "BR";
                  const isRun = act.activityCode.category.code === "PR";
                  
                  return (
                    <tr key={act.id} className="hover:bg-[#232029]/10 transition-colors align-top">
                      
                      {/* LEFT SIDE: Original Telemetry Log Block */}
                      <td className="py-4 px-5 border-r border-[#26232b] bg-[#141318]/10">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-zinc-400 font-sans text-[10px] font-bold uppercase tracking-wider">
                              Parameter Machine:
                            </span>
                            <span className="font-bold text-zinc-300 bg-zinc-800/60 px-2 py-0.5 rounded text-[10px]">
                              {okpLog.machine.name}
                            </span>
                          </div>
                          
                          <div className="flex flex-col gap-0.5 mt-1">
                            <span className="text-[10px] text-[#8e8b94] uppercase font-sans">Article Code Regist:</span>
                            <span className={`text-xs font-extrabold ${isRun ? "text-[#5ebd56]" : "text-[#fed130]"}`}>
                              [{act.activityCode.code.toUpperCase()}] &gt;&gt; {act.activityCode.fullDescription}
                            </span>
                          </div>

                          <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-[#26232b]/40">
                            <span className="text-[10px] text-[#8e8b94] uppercase font-sans">Time Duration:</span>
                            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#fed130]" />
                              {act.duration} <span className="text-[10px] font-normal text-[#8e8b94]">Minutes</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* MIDDLE DIRECTION ARROW */}
                      <td className="py-4 px-2 text-center align-middle border-r border-[#26232b] bg-[#141318]/20">
                        <div className="flex justify-center">
                          <ArrowRight className="w-4 h-4 text-[#8e8b94]" />
                        </div>
                      </td>

                      {/* RIGHT SIDE: Interactive Operator Adjustment Form */}
                      <td className="py-4 px-5 bg-emerald-500/[0.01]">
                        <div className="flex flex-col gap-3">
                          {/* Dropdown Adjustment Code */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase font-sans tracking-wide">
                              Adjust Article Code *
                            </label>
                            <select
                              value={state.activityCodeId}
                              onChange={(e) => handleRowChange(act.id, "activityCodeId", e.target.value)}
                              disabled={state.isSubmitting}
                              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs text-zinc-200 focus:outline-none focus:border-[#5ebd56] disabled:opacity-50"
                            >
                              <option value="">-- Pilih Kode Penyesuaian --</option>
                              {activityCodes.map((ac) => (
                                <option key={ac.id} value={ac.id}>
                                  [{ac.code.toUpperCase()}] &gt;&gt; {ac.fullDescription} ({ac.category.name})
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Reason Input */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-zinc-400 uppercase font-sans tracking-wide">
                              Reason / Action Plan
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., problem utama karena guide yang tidak pass pada jalur"
                              value={state.reason}
                              onChange={(e) => handleRowChange(act.id, "reason", e.target.value)}
                              disabled={state.isSubmitting}
                              className="w-full px-3 py-2 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-[#5ebd56] disabled:opacity-50"
                            />
                          </div>

                          {/* Action Button */}
                          <div className="flex justify-end mt-1">
                            <button
                              type="button"
                              onClick={() => handleAdjustRow(act.id)}
                              disabled={state.isSubmitting}
                              className={`px-4 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider font-sans transition-all flex items-center gap-1 cursor-pointer ${
                                state.activityCodeId === String(act.activityCodeId) && state.reason === (act.brRootCause || "")
                                  ? "bg-[#161b22] text-[#8e8b94] border border-[#30363d] hover:bg-zinc-800"
                                  : "bg-[#5ebd56] hover:bg-[#53a74c] text-black font-extrabold shadow-lg shadow-[#5ebd56]/10"
                              }`}
                            >
                              {state.isSubmitting ? (
                                <>
                                  <Clock className="w-3 h-3 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                <>
                                  <Check className="w-3 h-3" />
                                  {state.activityCodeId === String(act.activityCodeId) && state.reason === (act.brRootCause || "")
                                    ? "Confirm"
                                    : "Adjust Code"}
                                </>
                              )}
                            </button>
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

        {/* BOTTOM ADMONITION WARNING (MATCHING DIAGRAM SUBTEXT EXACTLY) */}
        <div className="bg-[#141318]/60 p-4 border-t border-[#26232b] flex items-start gap-2.5">
          <AlertTriangle className="w-4.5 h-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest font-mono">
              Peringatan Aturan Seri Pareto Telemetry:
            </span>
            <p className="text-[10px] text-zinc-400 font-sans leading-relaxed">
              Apabila ketemu lebih dari 1 kategori yang sama dalam record data secara seri (berturut-turut pada timeline mesin), 
              maka frekuensi henti pada grafik Pareto OEE secara otomatis **dihitung sebagai 1 kejadian**, dengan akumulasi total durasi menit yang dijumlahkan secara presisi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
