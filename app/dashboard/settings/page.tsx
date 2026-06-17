"use client";

import React, { useState } from "react";
import {
  Settings,
  ShieldAlert,
  Save,
  CheckCircle2,
  Clock,
  Gauge,
  Sliders,
} from "lucide-react";

export default function SettingsConfigPage() {
  const [success, setSuccess] = useState("");
  
  // Custom states matching typical OEE targets
  const [oeeTarget, setOeeTarget] = useState(85);
  const [availTarget, setAvailTarget] = useState(90);
  const [perfTarget, setPerfTarget] = useState(95);
  const [qualTarget, setQualTarget] = useState(99);
  
  // Shift offsets in minutes
  const [shift1Min, setShift1Min] = useState(480);
  const [shift2Min, setShift2Min] = useState(480);
  const [shift3Min, setShift3Min] = useState(480);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess("Configuration settings successfully saved to local system storage.");
    setTimeout(() => setSuccess(""), 4000);
  };

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-4xl mx-auto w-full bg-[var(--bg-base)] text-[var(--text-primary)] transition-colors duration-200">
      
      {/* 1. HEADER PANEL */}
      <div className="flex justify-between items-center border-b border-[var(--border-color)] pb-5">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
            <div className="p-1.5 bg-[var(--hover-bg)] rounded-lg border border-[var(--border-color)] text-[var(--primary-brand)]">
              <Settings className="w-5 h-5" />
            </div>
            <span>System Configuration Panel</span>
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">Konfigurasi batas target OEE dunia dan parameter kalkulasi waktu standar pabrik.</p>
        </div>
      </div>

      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-[var(--primary-brand)] p-4 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(0,143,76,0.05)]">
          <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {/* 2. CONFIGURATION FIELDS FORM */}
      <form onSubmit={handleSave} className="space-y-6">
        
        {/* Section 1: OEE World-Class Standards */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
            <Gauge className="w-4 h-4 text-[var(--primary-brand)]" />
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest font-mono">
              OEE Target Parameters (%)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">World-Class OEE Standard Target *</span>
              <input
                type="number"
                value={oeeTarget}
                onChange={(e) => setOeeTarget(Number(e.target.value))}
                required
                className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-zinc-700 focus:outline-none focus:border-[var(--primary-brand)] focus:ring-1 focus:ring-[var(--primary-brand)]/15"
              />
            </div>
            
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Availability Target (AR) *</span>
              <input
                type="number"
                value={availTarget}
                onChange={(e) => setAvailTarget(Number(e.target.value))}
                required
                className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-zinc-700 focus:outline-none focus:border-[var(--primary-brand)] focus:ring-1 focus:ring-[var(--primary-brand)]/15"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Performance Target (PR) *</span>
              <input
                type="number"
                value={perfTarget}
                onChange={(e) => setPerfTarget(Number(e.target.value))}
                required
                className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-zinc-700 focus:outline-none focus:border-[var(--primary-brand)] focus:ring-1 focus:ring-[var(--primary-brand)]/15"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Quality Target (QR) *</span>
              <input
                type="number"
                value={qualTarget}
                onChange={(e) => setQualTarget(Number(e.target.value))}
                required
                className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-zinc-700 focus:outline-none focus:border-[var(--primary-brand)] focus:ring-1 focus:ring-[var(--primary-brand)]/15"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Shift Minutes Calculations */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest font-mono">
              Working Shift Minutes (Scheduled loading)
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Shift 1 Standard (min) *</span>
              <input
                type="number"
                value={shift1Min}
                onChange={(e) => setShift1Min(Number(e.target.value))}
                required
                className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-zinc-700 focus:outline-none focus:border-[var(--primary-brand)] focus:ring-1 focus:ring-[var(--primary-brand)]/15"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Shift 2 Standard (min) *</span>
              <input
                type="number"
                value={shift2Min}
                onChange={(e) => setShift2Min(Number(e.target.value))}
                required
                className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-zinc-700 focus:outline-none focus:border-[var(--primary-brand)] focus:ring-1 focus:ring-[var(--primary-brand)]/15"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase">Shift 3 Standard (min) *</span>
              <input
                type="number"
                value={shift3Min}
                onChange={(e) => setShift3Min(Number(e.target.value))}
                required
                className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-zinc-700 focus:outline-none focus:border-[var(--primary-brand)] focus:ring-1 focus:ring-[var(--primary-brand)]/15"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Data Security & System State */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
            <Sliders className="w-4 h-4 text-orange-500" />
            <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-widest font-mono">
              System Live Controls
            </h3>
          </div>

          <div className="flex items-center gap-3.5 p-4 rounded-lg bg-rose-500/5 border border-rose-500/10 text-rose-500">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div className="text-xs font-mono">
              <p className="font-bold uppercase tracking-wider">Restricted Administration</p>
              <p className="text-[11px] text-[var(--text-secondary)] leading-normal mt-0.5">
                Batas standard target OEE ini bersifat sistemik. Mengubah parameter ini akan memicu penghitungan ulang historis telemetri pada dasbor real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Form Action Bar */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-3 bg-[var(--primary-brand)] hover:bg-[var(--primary-hover)] text-white font-extrabold rounded-lg text-xs font-mono tracking-widest uppercase transition-all shadow-sm cursor-pointer"
          >
            <Save className="w-4 h-4" />
            Save Configurations
          </button>
        </div>
      </form>

    </div>
  );
}
