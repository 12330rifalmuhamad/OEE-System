"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Cpu, Clock, CheckCircle2, ShieldAlert } from "lucide-react";

interface StoppageData {
  activityLogId?: number;
  machineId: number;
  machineName: string;
  okpNumber: string;
  state: "STOP" | "RUN";
  activityCode?: string;
  category?: string;
  description?: string;
  startTime?: string;
}

export default function RealtimePopup() {
  const [activeStoppage, setActiveStoppage] = useState<StoppageData | null>(null);
  const [isResumed, setIsResumed] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // States for downtime classification
  const [activityCodes, setActivityCodes] = useState<any[]>([]);
  const [selectedCodeId, setSelectedCodeId] = useState<string>("");
  const [reasonText, setReasonText] = useState<string>("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isGuest, setIsGuest] = useState(false);

  // SSE Listener Setup
  useEffect(() => {
    // Fetch initial active stoppage status on load
    fetch("/api/transactions/realtime/active-stoppage")
      .then(async (res) => {
        if (res.ok) {
          const data = await res.json();
          if (data.activeStoppage) {
            console.log("[SSE] Loaded active stoppage on mount:", data.activeStoppage);
            setIsResumed(false);
            setActiveStoppage(data.activeStoppage);
          }
        }
      })
      .catch((err) => console.error("Gagal memuat status henti mesin awal:", err));

    // Direct backend connection in local development to bypass Next.js dev server buffering
    const sseUrl =
      typeof window !== "undefined" &&
      (window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        ["3000", "3001", "3002"].includes(window.location.port))
        ? `${window.location.protocol}//${window.location.hostname}:5001/api/transactions/realtime/stream`
        : "/api/transactions/realtime/stream";

    console.log(`[SSE] Initializing EventSource stream to: ${sseUrl}`);
    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener("connected", (event: any) => {
      const data = JSON.parse(event.data);
      console.log("[SSE] Connection established signal:", data.message);
    });

    eventSource.addEventListener("machine_state_change", (event: any) => {
      try {
        const payload: StoppageData = JSON.parse(event.data);
        console.log("[SSE] Machine state change event received:", payload);

        if (payload.state === "STOP") {
          setIsResumed(false);
          setActiveStoppage(payload);
        } else if (payload.state === "RUN") {
          setIsResumed(true);
          // Wait 3 seconds before hiding the modal entirely
          setTimeout(() => {
            setActiveStoppage(null);
            setIsResumed(false);
          }, 3000);
        }
      } catch (err) {
        console.error("[SSE] Failed to parse event payload:", err);
      }
    });

    eventSource.onerror = (err) => {
      console.error("[SSE] EventSource connection error, reconnecting...", err);
    };

    return () => {
      console.log("[SSE] Closing EventSource connection stream.");
      eventSource.close();
    };
  }, []);

  // Live Timer Stopwatch Effect
  useEffect(() => {
    if (!activeStoppage || !activeStoppage.startTime || isResumed) return;

    // Reset stopwatch count
    const start = new Date(activeStoppage.startTime).getTime();
    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((Date.now() - start) / 1000));
      setElapsedSeconds(diff);
    };

    updateTimer(); // Initial run
    const intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [activeStoppage, isResumed]);

  // Fetch activity codes if the active stoppage is unknown
  useEffect(() => {
    if (activeStoppage && activeStoppage.state === "STOP" && activeStoppage.activityCode === "unknown") {
      fetch("/api/master/activity-codes")
        .then(async (res) => {
          if (res.ok) {
            const data = await res.json();
            setActivityCodes(data.activityCodes || []);
            setIsGuest(false);
          } else if (res.status === 401) {
            setIsGuest(true);
          }
        })
        .catch(() => {
          setIsGuest(true);
        });

      // Reset form states
      setSelectedCodeId("");
      setReasonText("");
      setSuccess(false);
      setErrorMsg("");
    }
  }, [activeStoppage]);

  const handleSubmitClassification = async () => {
    if (!activeStoppage || !activeStoppage.activityLogId) return;
    setSubmitting(true);
    setErrorMsg("");
    setSuccess(false);

    try {
      const res = await fetch(`/api/transactions/activity-logs/${activeStoppage.activityLogId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activityCodeId: parseInt(selectedCodeId, 10),
          brRootCause: reasonText || null,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        const data = await res.json();
        
        // Update local activeStoppage data so UI shows the correct name immediately
        const newCode = data.activityLog.activityCode;
        setActiveStoppage(prev => {
          if (!prev) return null;
          return {
            ...prev,
            activityCode: newCode.code,
            category: newCode.category.code,
            description: newCode.fullDescription,
          };
        });
      } else {
        const errData = await res.json();
        setErrorMsg(errData.error || "Gagal mengklasifikasikan downtime.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Koneksi gagal atau sesi habis.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!activeStoppage) return null;

  // Format seconds to HH:MM:SS
  const formatTime = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    const pad = (num: number) => String(num).padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      
      {/* Premium Glassmorphism Card */}
      <div 
        className={`w-full max-w-lg rounded-2xl border p-7 shadow-2xl relative overflow-hidden transition-all duration-500 ease-out transform scale-100 ${
          isResumed 
            ? "bg-emerald-950/20 border-emerald-500/30 text-zinc-100 shadow-emerald-500/5" 
            : "bg-rose-950/20 border-rose-500/30 text-zinc-100 shadow-rose-500/5"
        }`}
      >
        {/* Glow Ring Effects */}
        <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-[100px] -z-10 transition-colors duration-500 ${isResumed ? "bg-emerald-500/20" : "bg-rose-500/20"}`} />
        <div className={`absolute bottom-0 left-0 w-32 h-32 rounded-full blur-[80px] -z-10 transition-colors duration-500 ${isResumed ? "bg-emerald-600/10" : "bg-rose-600/10"}`} />

        {/* Modal Header */}
        <div className="flex items-center gap-4.5 pb-5 border-b border-zinc-800/60">
          <div 
            className={`p-3 rounded-xl flex items-center justify-center transition-all duration-500 ${
              isResumed 
                ? "bg-emerald-500/10 text-emerald-400 animate-bounce" 
                : "bg-rose-500/10 text-rose-400 animate-pulse"
            }`}
          >
            {isResumed ? (
              <CheckCircle2 className="w-7 h-7" />
            ) : (
              <AlertTriangle className="w-7 h-7" />
            )}
          </div>
          <div>
            <h3 
              className={`text-lg font-bold font-mono uppercase tracking-wider transition-colors duration-500 ${
                isResumed ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {isResumed ? "Mesin Kembali Berjalan" : "Peringatan: Mesin Terhenti!"}
            </h3>
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5 uppercase tracking-widest">
              OEE Telemetry Monitoring System
            </p>
          </div>
        </div>

        {/* Modal Body / Information Panel */}
        <div className="py-6 flex flex-col gap-4 font-mono text-xs">
          
          {/* Machine Name */}
          <div className="flex justify-between items-center bg-zinc-900/40 border border-zinc-850 p-3.5 rounded-xl">
            <span className="text-zinc-400 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-zinc-500" />
              Parameter Mesin:
            </span>
            <span className="font-bold text-zinc-100 text-sm">{activeStoppage.machineName}</span>
          </div>

          {/* OKP Code */}
          <div className="flex justify-between items-center bg-zinc-900/40 border border-zinc-850 p-3.5 rounded-xl">
            <span className="text-zinc-400 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-500" />
              Nomor OKP Aktif:
            </span>
            <span className="font-extrabold text-[#5ebd56] text-sm">{activeStoppage.okpNumber}</span>
          </div>

          {/* Stoppage Reason */}
          {!isResumed && (
            activeStoppage.activityCode === "unknown" ? (
              <div className="flex flex-col gap-3 bg-rose-500/[0.02] border border-rose-500/20 p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                    Sebab Henti: Belum Diketahui
                  </span>
                  {isGuest && (
                    <span className="text-[9px] bg-rose-500/10 text-rose-400 px-2 py-0.5 rounded border border-rose-500/20 uppercase font-bold tracking-wider">
                      Read-Only
                    </span>
                  )}
                </div>
                
                {errorMsg && (
                  <p className="text-[10px] text-rose-400 font-semibold">{errorMsg}</p>
                )}
                {success && (
                  <p className="text-[10px] text-emerald-400 font-semibold">Berhasil mengklasifikasikan downtime!</p>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Pilih Jenis Downtime Baru:</label>
                  <select
                    value={selectedCodeId}
                    onChange={(e) => {
                      setSelectedCodeId(e.target.value);
                      setErrorMsg("");
                    }}
                    disabled={submitting || isGuest || success}
                    className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-rose-500 rounded-lg text-xs text-zinc-200 focus:outline-none disabled:opacity-50"
                  >
                    <option value="">-- Pilih Sebab Downtime --</option>
                    {activityCodes
                      .filter(ac => ac.category.code !== "PR")
                      .map(ac => (
                        <option key={ac.id} value={ac.id}>
                          [{ac.code.toUpperCase()}] {ac.fullDescription}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Rencana Tindakan / Tindakan:</label>
                  <input
                    type="text"
                    placeholder="Masukkan alasan atau tindakan perbaikan..."
                    value={reasonText}
                    onChange={(e) => setReasonText(e.target.value)}
                    disabled={submitting || isGuest || success}
                    className="w-full px-3 py-2 bg-zinc-900/60 border border-zinc-800 focus:border-rose-500 rounded-lg text-xs text-zinc-200 focus:outline-none disabled:opacity-50"
                  />
                </div>

                {!success && !isGuest && (
                  <button
                    type="button"
                    onClick={handleSubmitClassification}
                    disabled={submitting || !selectedCodeId}
                    className="w-full py-2 bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-black font-extrabold rounded-lg text-[10px] uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {submitting ? "Menyimpan..." : "Simpan Klasifikasi Downtime"}
                  </button>
                )}

                {isGuest && (
                  <p className="text-[9px] text-rose-300/60 leading-relaxed font-sans mt-1">
                    * Silakan login sebagai Operator atau Manager untuk mengklasifikasikan downtime ini.
                  </p>
                )}
              </div>
            ) : (
              activeStoppage.activityCode && (
                <div className="flex flex-col gap-1.5 bg-rose-500/[0.02] border border-rose-500/10 p-3.5 rounded-xl">
                  <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider">
                    Sebab Henti Mesin:
                  </span>
                  <p className="text-zinc-200 leading-relaxed font-sans text-[13px] font-medium">
                    <span className="font-bold font-mono text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.5 rounded text-xs mr-2">
                      [{activeStoppage.activityCode.toUpperCase()}]
                    </span>
                    {activeStoppage.description}
                  </p>
                </div>
              )
            )
          )}

          {/* Elapsed Duration Stoppage */}
          <div 
            className={`flex flex-col items-center justify-center p-5 rounded-xl border text-center transition-all duration-500 ${
              isResumed 
                ? "bg-emerald-500/[0.02] border-emerald-500/10" 
                : "bg-rose-500/[0.02] border-rose-500/10"
            }`}
          >
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">
              {isResumed ? "Total Durasi Henti:" : "Durasi Henti Berjalan:"}
            </span>
            <span 
              className={`text-4xl font-extrabold font-mono tracking-wider mt-2.5 transition-colors duration-500 ${
                isResumed ? "text-emerald-400" : "text-rose-400 animate-pulse"
              }`}
            >
              {formatTime(elapsedSeconds)}
            </span>
          </div>
        </div>

        {/* Modal Footer / Notification Info */}
        <div className="mt-2 pt-4.5 border-t border-zinc-800/60 flex items-start gap-3 bg-zinc-900/15 p-3 rounded-xl border border-zinc-850">
          <ShieldAlert className="w-5 h-5 text-[#fed130] shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5 font-mono text-[10px]">
            <span className="font-extrabold text-[#fed130] uppercase tracking-wider">
              Autopilot Mode:
            </span>
            <p className="text-zinc-400 font-sans leading-relaxed">
              Downtime ini telah terdeteksi secara otomatis oleh sensor telemetri dan disimpan langsung ke database. Tidak ada input manual yang perlu dimasukkan.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
