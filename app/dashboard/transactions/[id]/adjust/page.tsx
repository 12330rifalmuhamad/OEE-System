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
  machine: { name: string; lineProcess?: { name: string } | null };
  product: { name: string; standarSpeed: number };
  activities: ActivityLog[];
}

function SearchableGroupedSelect({
  value,
  onChange,
  options,
  disabled
}: {
  value: string;
  onChange: (val: string) => void;
  options: ActivityCode[];
  disabled?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find(o => String(o.id) === value);

  // Extract unique categories
  const categories = options.reduce((acc, curr) => {
    const name = curr.category.name;
    const code = curr.category.code;
    if (!acc.some(c => c.name === name)) {
      acc.push({ name, code });
    }
    return acc;
  }, [] as { name: string; code: string }[]);

  // Filter options based on selected category and search query
  const filteredOptions = options.filter(o => {
    const matchesCat = selectedCat ? o.category.name === selectedCat : true;
    const matchesSearch = o.code.toLowerCase().includes(search.toLowerCase()) ||
      o.fullDescription.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="relative w-full font-mono text-xs" ref={dropdownRef}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => {
          setIsOpen(!isOpen);
          if (!isOpen && selectedOption) {
            setSelectedCat(selectedOption.category.name);
          }
        }}
        className="w-full text-left px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] hover:border-zinc-500 rounded-lg text-[var(--text-primary)] focus:outline-none flex justify-between items-center transition-all disabled:opacity-50"
      >
        <span className="truncate pr-2">
          {selectedOption
            ? `[${selectedOption.code.toUpperCase()}] - ${selectedOption.fullDescription}`
            : "-- Pilih Kode Penyesuaian --"}
        </span>
        <span className="text-[var(--text-secondary)] ml-auto text-[10px] shrink-0">▼</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full z-50 max-h-80 overflow-y-auto bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-2xl p-3.5 flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-150">

          {/* STEP 1: SELECT CATEGORY */}
          {!selectedCat ? (
            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider pb-1.5 border-b border-[var(--border-color)] font-sans">
                Pilih Kategori :
              </div>
              <div className="flex flex-col gap-1.5 py-1">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setSelectedCat(cat.name)}
                    className="w-full text-left px-3 py-2 bg-[var(--bg-input)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] hover:border-zinc-500 rounded-lg text-[var(--text-primary)] flex items-center justify-between transition-all"
                  >
                    <span className="font-semibold text-xs font-sans">{cat.name}</span>
                    <span className="font-extrabold text-[10px] px-2 py-0.5 rounded bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-color)] tracking-wider">
                      {cat.code.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* STEP 2: SELECT ACTIVITY CODE IN SELECTED CATEGORY */
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCat(null);
                    setSearch("");
                  }}
                  className="text-[10px] font-extrabold text-[#fed130] hover:text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1 transition-colors font-sans"
                >
                  ← Ganti Kategori
                </button>
                <span className="text-[10px] font-extrabold text-[#5ebd56] uppercase tracking-wider bg-[#5ebd56]/10 px-2 py-0.5 rounded border border-[#5ebd56]/20 font-sans">
                  {selectedCat}
                </span>
              </div>

              <div className="sticky top-0 bg-[var(--bg-card)] pb-1.5 z-10">
                <input
                  type="text"
                  placeholder={`Cari di kategori ${selectedCat}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[#5ebd56] rounded-md text-[var(--text-primary)] text-xs focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1 py-1 max-h-48 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                  <div className="text-center py-4 text-[var(--text-secondary)] italic font-sans">
                    Tidak ada kode aktivitas yang cocok.
                  </div>
                ) : (
                  filteredOptions.map((ac) => (
                    <button
                      key={ac.id}
                      type="button"
                      onClick={() => {
                        onChange(String(ac.id));
                        setIsOpen(false);
                        setSearch("");
                      }}
                      className={`w-full text-left px-2 py-2 rounded hover:bg-[var(--hover-bg)] flex items-start gap-2.5 transition-colors ${value === String(ac.id) ? "bg-[var(--hover-bg)] border border-[#5ebd56]/30 text-[var(--text-primary)] font-semibold" : "text-[var(--text-secondary)]"
                        }`}
                    >
                      <span className="font-extrabold text-[#fed130] bg-[#fed130]/10 border border-[#fed130]/20 px-1.5 py-0.5 rounded text-[10px] tracking-wide shrink-0 font-mono">
                        {ac.code.toUpperCase()}
                      </span>
                      <span className="leading-snug font-sans text-xs">{ac.fullDescription}</span>
                    </button>
                  )))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
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
      <div className="flex-grow flex items-center justify-center bg-transparent text-[var(--text-secondary)] font-mono py-20">
        <div className="flex flex-col items-center gap-3">
          <Clock className="w-8 h-8 text-[#5ebd56] animate-spin" />
          <span>Memuat detail aktivitas transaksi OEE...</span>
        </div>
      </div>
    );
  }

  if (!okpLog) {
    return (
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full bg-transparent text-[var(--text-primary)]">
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-3 font-mono">
          <AlertTriangle className="w-5 h-5" />
          <span>Detail transaksi tidak ditemukan atau Anda tidak terautentikasi.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full bg-transparent text-[var(--text-primary)] relative z-10">

      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border-color)] pb-5">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/transactions"
            className="p-2 bg-[var(--bg-card)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all"
            title="Kembali ke Daftar Transaksi"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] font-mono tracking-tight flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-[#5ebd56]" />
              Downtime Data Adjuster
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">
              OEE System (Stage 1. Input & Manual Reconcile) untuk OKP:{" "}
              <span className="text-[#5ebd56] font-extrabold">{okpLog.okpNumber}</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-[var(--bg-card)] border border-[var(--border-color)] px-4 py-2 rounded-lg font-mono text-xs shadow-[var(--card-shadow)]">
          <div className="flex items-center gap-1.5 border-r border-[var(--border-color)] pr-3">
            <Cpu className="w-4.5 h-4.5 text-[#5ebd56]" />
            <span className="text-[var(--text-primary)]">{okpLog.machine.lineProcess?.name || okpLog.machine.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-4.5 h-4.5 text-[#fed130]" />
            <span className="text-[var(--text-primary)]">Shift {okpLog.shift}</span>
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
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-[#5ebd56] p-3.5 rounded-lg text-xs font-semibold flex items-center gap-2">
          <ShieldCheck className="w-4.5 h-4.5 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {/* DOUBLE-BOARD LAYOUT CONTAINER */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-[var(--card-shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--bg-sidebar)]/30 border-b border-[var(--border-color)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider font-mono">
                {/* LEFT SIDE: Automatic Record by System */}
                <th className="py-4 px-5 border-r border-[var(--border-color)] w-1/2">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-[var(--text-secondary)]" />
                    <span className="text-[var(--text-secondary)]">Automatic Record Data by System</span>
                    <span className="text-[10px] ml-auto bg-[var(--bg-input)] text-[var(--text-secondary)] px-2 py-0.5 rounded font-normal font-sans uppercase border border-[var(--border-color)]">Read Only</span>
                  </div>
                </th>

                {/* MIDDLE ARROW COLUMN */}
                <th className="py-4 px-2 text-center w-12 border-r border-[var(--border-color)] bg-[var(--bg-sidebar)]/20">
                  <div className="flex items-center justify-center">
                    <ArrowRight className="w-4 h-4 text-[var(--text-secondary)]" />
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
            <tbody className="divide-y divide-[var(--border-color)] font-mono">
              {okpLog.activities.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-12 text-center text-[var(--text-secondary)] italic font-sans">
                    Belum ada data aktivitas atau downtime yang terekam pada OKP ini.
                  </td>
                </tr>
              ) : (
                okpLog.activities.map((act) => {
                  const state = rowStates[act.id] || { activityCodeId: "", reason: "", isSubmitting: false };
                  const isBreakdown = act.activityCode.category.code === "BR";
                  const isRun = act.activityCode.category.code === "PR";

                  return (
                    <tr key={act.id} className="hover:bg-[var(--hover-bg)]/20 transition-colors align-top">

                      {/* LEFT SIDE: Original Telemetry Log Block */}
                      <td className="py-4 px-5 border-r border-[var(--border-color)] bg-[var(--bg-sidebar)]/10">
                        <div className="flex flex-col gap-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-[var(--text-secondary)] font-sans text-[10px] font-bold uppercase tracking-wider">
                              Parameter Line:
                            </span>
                            <span className="font-bold text-[var(--text-primary)] bg-[var(--bg-input)] px-2 py-0.5 rounded text-[10px] border border-[var(--border-color)]/60">
                              {okpLog.machine.lineProcess?.name || okpLog.machine.name}
                            </span>
                          </div>

                          <div className="flex flex-col gap-0.5 mt-1">
                            <span className="text-[10px] text-[var(--text-secondary)] uppercase font-sans">Article Code Regist:</span>
                            <span className={`text-xs font-extrabold ${isRun ? "text-[#5ebd56]" : "text-[#fed130]"}`}>
                              [{act.activityCode.code.toUpperCase()}] &gt;&gt; {act.activityCode.fullDescription}
                            </span>
                          </div>

                          <div className="flex justify-between items-center mt-1 pt-1.5 border-t border-[var(--border-color)]/40">
                            <span className="text-[10px] text-[var(--text-secondary)] uppercase font-sans">Time Duration:</span>
                            <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-[#fed130]" />
                              {act.duration} <span className="text-[10px] font-normal text-[var(--text-secondary)]">Minutes</span>
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* MIDDLE DIRECTION ARROW */}
                      <td className="py-4 px-2 text-center align-middle border-r border-[var(--border-color)] bg-[var(--bg-sidebar)]/20">
                        <div className="flex justify-center">
                          <ArrowRight className="w-4 h-4 text-[var(--text-secondary)]" />
                        </div>
                      </td>

                      {/* RIGHT SIDE: Interactive Operator Adjustment Form */}
                      <td className="py-4 px-5 bg-[#5ebd56]/[0.01]">
                        <div className="flex flex-col gap-3">
                          {/* Dropdown Adjustment Code */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase font-sans tracking-wide">
                              Adjust Article Code *
                            </label>
                            <SearchableGroupedSelect
                              value={state.activityCodeId}
                              onChange={(val) => handleRowChange(act.id, "activityCodeId", val)}
                              options={activityCodes}
                              disabled={state.isSubmitting}
                            />
                          </div>

                          {/* Reason Input */}
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase font-sans tracking-wide">
                              Reason / Action Plan
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., problem utama karena guide yang tidak pass pada jalur"
                              value={state.reason}
                              onChange={(e) => handleRowChange(act.id, "reason", e.target.value)}
                              disabled={state.isSubmitting}
                              className="w-full px-3 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:outline-none focus:border-[#5ebd56] disabled:opacity-50"
                            />
                          </div>

                          {/* Action Button */}
                          <div className="flex justify-end mt-1">
                            <button
                              type="button"
                              onClick={() => handleAdjustRow(act.id)}
                              disabled={state.isSubmitting}
                              className={`px-4 py-1.5 rounded-lg text-[10px] uppercase font-bold tracking-wider font-sans transition-all flex items-center gap-1 cursor-pointer ${state.activityCodeId === String(act.activityCodeId) && state.reason === (act.brRootCause || "")
                                  ? "bg-[var(--bg-input)] text-[var(--text-secondary)] border border-[var(--border-color)] hover:bg-[var(--hover-bg)]"
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
        <div className="bg-[var(--bg-sidebar)]/20 p-4 border-t border-[var(--border-color)] flex items-start gap-2.5">
          <AlertTriangle className="w-4.5 h-4.5 text-amber-500 flex-shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-extrabold text-amber-500 uppercase tracking-widest font-mono">
              Peringatan Aturan Seri Pareto Telemetry:
            </span>
            <p className="text-[10px] text-[var(--text-secondary)] font-sans leading-relaxed">
              Apabila ketemu lebih dari 1 kategori yang sama dalam record data secara seri (berturut-turut pada timeline mesin),
              maka frekuensi henti pada grafik Pareto OEE secara otomatis **dihitung sebagai 1 kejadian**, dengan akumulasi total durasi menit yang dijumlahkan secara presisi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
