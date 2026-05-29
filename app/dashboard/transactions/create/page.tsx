"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Save,
  Plus,
  Trash2,
  AlertTriangle,
  Cpu,
  Package,
  Calendar,
  Clock,
  CheckCircle,
  HelpCircle,
} from "lucide-react";

interface Machine {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  productCode: string | null;
  standarSpeed: number;
}

interface ActivityCode {
  id: string;
  code: string;
  fullDescription: string;
  category: { code: string; name: string };
}

interface ActivityEntry {
  activityCodeId: string;
  code: string;
  description: string;
  categoryCode: string;
  duration: string;
  startTime: string;
  endTime: string;
  // Breakdown specifics
  brRootCause?: string;
  brMtdtWaiting?: string;
  brMtdtRepair?: string;
  brMtdtStartup?: string;
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
        className="w-full text-left px-3 py-2 bg-[#161b22] border border-[#30363d] hover:border-zinc-500 rounded-lg text-zinc-200 focus:outline-none flex justify-between items-center transition-all disabled:opacity-50"
      >
        <span className="truncate pr-2">
          {selectedOption
            ? `[${selectedOption.code.toUpperCase()}] - ${selectedOption.fullDescription}`
            : "-- Pilih Kode Aktivitas --"}
        </span>
        <span className="text-[#8e8b94] ml-auto text-[10px] shrink-0">▼</span>
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-full z-50 max-h-80 overflow-y-auto bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl p-3.5 flex flex-col gap-3 animate-in fade-in slide-in-from-top-1 duration-150">

          {/* STEP 1: SELECT CATEGORY */}
          {!selectedCat ? (
            <div className="flex flex-col gap-2">
              <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider pb-1.5 border-b border-[#30363d] font-sans">
                Pilih Kategori :
              </div>
              <div className="flex flex-col gap-1.5 py-1">
                {categories.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setSelectedCat(cat.name)}
                    className="w-full text-left px-3 py-2 bg-[#0d1117] hover:bg-[#21262d] border border-[#30363d] hover:border-zinc-500 rounded-lg text-zinc-200 flex items-center justify-between transition-all"
                  >
                    <span className="font-semibold text-xs font-sans">{cat.name}</span>
                    <span className="font-extrabold text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700 tracking-wider">
                      {cat.code.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            /* STEP 2: SELECT ACTIVITY CODE IN SELECTED CATEGORY */
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-[#30363d]">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCat(null);
                    setSearch("");
                  }}
                  className="text-[10px] font-extrabold text-[#fed130] hover:text-white uppercase tracking-wider flex items-center gap-1 transition-colors font-sans"
                >
                  ← Ganti Kategori
                </button>
                <span className="text-[10px] font-extrabold text-[#5ebd56] uppercase tracking-wider bg-[#5ebd56]/10 px-2 py-0.5 rounded border border-[#5ebd56]/20 font-sans">
                  {selectedCat}
                </span>
              </div>

              <div className="sticky top-0 bg-[#161b22] pb-1.5 z-10">
                <input
                  type="text"
                  placeholder={`Cari di kategori ${selectedCat}...`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-1.5 bg-[#0d1117] border border-[#30363d] focus:border-[#5ebd56] rounded-md text-zinc-200 text-xs focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="flex flex-col gap-1 py-1 max-h-48 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                  <div className="text-center py-4 text-[#8e8b94] italic font-sans">
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
                      className={`w-full text-left px-2 py-2 rounded hover:bg-[#21262d] flex items-start gap-2.5 transition-colors ${value === String(ac.id) ? "bg-[#21262d] border border-[#5ebd56]/30 text-white" : "text-zinc-300"
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

export default function CreateOKPLogPage() {
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(1);

  // Masters fetched from API
  const [machines, setMachines] = useState<Machine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activityCodes, setActivityCodes] = useState<ActivityCode[]>([]);

  // Page level messaging
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // STEP 1 FIELDS (Identity & Man Power)
  const [okpNumber, setOkpNumber] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [shift, setShift] = useState("1");
  const [machineId, setMachineId] = useState("");
  const [productId, setProductId] = useState("");
  const [groupLeader, setGroupLeader] = useState("");
  const [operator, setOperator] = useState("");
  const [helper, setHelper] = useState("");
  const [loadingTime, setLoadingTime] = useState("480"); // Standard shift is 480 mins

  // STEP 2 FIELDS (Activity logs)
  const [activityList, setActivityList] = useState<ActivityEntry[]>([]);
  const [selectedActCodeId, setSelectedActCodeId] = useState("");
  const [actDuration, setActDuration] = useState("");
  const [actStart, setActStart] = useState("");
  const [actEnd, setActEnd] = useState("");

  // STEP 4 FIELDS (Quality Output)
  const [totalOutput, setTotalOutput] = useState("");
  const [sampleQc, setSampleQc] = useState("");
  const [rework, setRework] = useState("");
  const [reject, setReject] = useState("");

  // Fetch Master Data on Mount
  useEffect(() => {
    async function fetchMasters() {
      try {
        const [resMach, resProd, resAct] = await Promise.all([
          fetch("/api/master/machines"),
          fetch("/api/master/products"),
          fetch("/api/master/activity-codes"),
        ]);
        if (resMach.ok) setMachines((await resMach.json()).machines);
        if (resProd.ok) setProducts((await resProd.json()).products);
        if (resAct.ok) setActivityCodes((await resAct.json()).activityCodes);
      } catch (err) {
        console.error("Failed to load master references", err);
      }
    }
    fetchMasters();
  }, []);

  // Calculate sum of durations
  const sumDurations = activityList.reduce((sum, act) => sum + parseFloat(act.duration || "0"), 0);
  const remainingTime = parseFloat(loadingTime || "0") - sumDurations;

  // Determine if there are any Breakdown entries in the activity list
  const hasBreakdownLogs = activityList.some((act) => act.categoryCode === "BR");

  // Filter out which steps exist (Step 3 is skipped if there are no breakdowns)
  const totalSteps = hasBreakdownLogs ? 4 : 3;

  // Handle adding an activity entry to Step 2 list
  const handleAddActivity = () => {
    setErrorMsg("");
    if (!selectedActCodeId || !actDuration) {
      setErrorMsg("Harap pilih Kode Aktivitas dan masukkan Durasi.");
      return;
    }

    const selectedCode = activityCodes.find((ac) => ac.id === selectedActCodeId);
    if (!selectedCode) return;

    const durationVal = parseFloat(actDuration);
    if (isNaN(durationVal) || durationVal <= 0) {
      setErrorMsg("Durasi harus angka positif.");
      return;
    }

    if (durationVal > remainingTime) {
      setErrorMsg(`Durasi (${durationVal}m) melebihi sisa Loading Time (${remainingTime}m).`);
      return;
    }

    const newEntry: ActivityEntry = {
      activityCodeId: selectedCode.id,
      code: selectedCode.code,
      description: selectedCode.fullDescription,
      categoryCode: selectedCode.category.code,
      duration: actDuration,
      startTime: actStart,
      endTime: actEnd,
      // Default breakdown details if BR
      brRootCause: selectedCode.category.code === "BR" ? "8 Basic Competency" : undefined,
      brMtdtWaiting: selectedCode.category.code === "BR" ? "0" : undefined,
      brMtdtRepair: selectedCode.category.code === "BR" ? "0" : undefined,
      brMtdtStartup: selectedCode.category.code === "BR" ? "0" : undefined,
    };

    setActivityList([...activityList, newEntry]);
    // Reset form inputs
    setSelectedActCodeId("");
    setActDuration("");
    setActStart("");
    setActEnd("");
  };

  // Remove activity entry
  const handleRemoveActivity = (idx: number) => {
    const updated = [...activityList];
    updated.splice(idx, 1);
    setActivityList(updated);
  };

  // Auto-allocate remaining loading time as Productive Run (PR)
  const handleAutoFillProductiveRun = () => {
    setErrorMsg("");
    if (remainingTime <= 0) {
      setErrorMsg("Tidak ada sisa Loading Time untuk dialokasikan.");
      return;
    }

    const prCode = activityCodes.find((ac) => ac.category.code === "PR");
    if (!prCode) {
      setErrorMsg("Kode Aktivitas untuk Productive Run (PR) tidak ditemukan di database.");
      return;
    }

    const newEntry: ActivityEntry = {
      activityCodeId: prCode.id,
      code: prCode.code,
      description: prCode.fullDescription,
      categoryCode: prCode.category.code,
      duration: remainingTime.toFixed(0),
      startTime: "",
      endTime: "",
    };

    setActivityList([...activityList, newEntry]);
  };

  // Update breakdown details inside Step 3
  const handleUpdateBreakdown = (idx: number, key: string, val: string) => {
    const updated = [...activityList];
    updated[idx] = { ...updated[idx], [key]: val };
    setActivityList(updated);
  };

  // Stepper helper
  const handleNext = () => {
    setErrorMsg("");

    if (activeStep === 1) {
      if (!okpNumber || !machineId || !productId || !loadingTime) {
        setErrorMsg("Harap isi No OKP, Lini Mesin, Produk, dan Loading Time.");
        return;
      }
      setActiveStep(2);
    } else if (activeStep === 2) {
      if (Math.abs(remainingTime) > 0.01) {
        setErrorMsg(`Total durasi aktivitas harus cocok dengan Loading Time. Anda masih memiliki selisih ${remainingTime} menit.`);
        return;
      }
      if (hasBreakdownLogs) {
        setActiveStep(3); // Go to Breakdown details
      } else {
        setActiveStep(4); // Skip Step 3 and go directly to output
      }
    } else if (activeStep === 3) {
      // Validate Step 3 breakdown totals
      for (let i = 0; i < activityList.length; i++) {
        const act = activityList[i];
        if (act.categoryCode === "BR") {
          const wait = parseFloat(act.brMtdtWaiting || "0");
          const repair = parseFloat(act.brMtdtRepair || "0");
          const start = parseFloat(act.brMtdtStartup || "0");
          const totalMtdt = wait + repair + start;
          const logDuration = parseFloat(act.duration);

          if (totalMtdt > logDuration) {
            setErrorMsg(`Total MTDT (${totalMtdt}m) pada breakdown '${act.code}' tidak boleh melebihi durasi downtime (${logDuration}m).`);
            return;
          }
        }
      }
      setActiveStep(4);
    }
  };

  const handleBack = () => {
    setErrorMsg("");
    if (activeStep === 4) {
      if (hasBreakdownLogs) {
        setActiveStep(3);
      } else {
        setActiveStep(2);
      }
    } else {
      setActiveStep(activeStep - 1);
    }
  };

  // Submit OKP Transaction to Server
  const handleSaveAll = async () => {
    setErrorMsg("");
    setIsSubmitting(true);

    if (!totalOutput) {
      setErrorMsg("Total Finished Goods Output wajib diisi.");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      okpNumber,
      date,
      shift: parseInt(shift),
      machineId,
      productId,
      groupLeader,
      operator,
      helper,
      loadingTime: parseFloat(loadingTime),
      totalOutput: parseFloat(totalOutput),
      rework: rework ? parseFloat(rework) : 0,
      reject: reject ? parseFloat(reject) : 0,
      sampleQc: sampleQc ? parseFloat(sampleQc) : null,
      activities: activityList.map((act) => ({
        activityCodeId: act.activityCodeId,
        duration: parseFloat(act.duration),
        startTime: act.startTime ? `${date}T${act.startTime}:00Z` : null,
        endTime: act.endTime ? `${date}T${act.endTime}:00Z` : null,
        brRootCause: act.brRootCause || null,
        brMtdtWaiting: act.brMtdtWaiting ? parseFloat(act.brMtdtWaiting) : null,
        brMtdtRepair: act.brMtdtRepair ? parseFloat(act.brMtdtRepair) : null,
        brMtdtStartup: act.brMtdtStartup ? parseFloat(act.brMtdtStartup) : null,
      })),
    };

    try {
      const res = await fetch("/api/transactions/okp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        router.push("/dashboard/transactions");
      } else {
        setErrorMsg(data.error || "Gagal menyimpan log transaksi.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Kesalahan koneksi ke database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Live Performance Estimation Helper for Step 4
  const activeProductObj = products.find((p) => p.id === productId);
  const estimatedPerformanceRate = () => {
    if (!activeProductObj || !totalOutput || !loadingTime) return null;
    const stdSpeed = activeProductObj.standarSpeed;
    const runTime = activityList.filter((act) => act.categoryCode === "PR").reduce((sum, act) => sum + parseFloat(act.duration), 0);
    if (runTime <= 0) return 0;
    const targetOutput = stdSpeed * runTime;
    const actualOutputCB = parseFloat(totalOutput);
    // standard output is CB, assuming 1 CB = standard amount or speed is directly in pcs
    // standard OEE calculation: Performance = (Actual Output) / (Standard Speed * Run Time)
    const perf = (actualOutputCB / targetOutput) * 100;
    return perf.toFixed(1);
  };

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-5xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-[#30363d] pb-6">
        <Link
          href="/dashboard/transactions"
          className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-200 border border-[#30363d] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Create OKP Log Entry</h2>
          <p className="text-sm text-zinc-400 mt-1">Menginput data aktivitas, detail downtime perbaikan, serta output produksi harian.</p>
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="bg-[#161b22] border border-[#30363d] p-5 rounded-xl flex items-center justify-between shadow-lg">
        {[
          { step: 1, label: "Identity & Man Power" },
          { step: 2, label: "Activities & Logs" },
          { step: 3, label: "Breakdown MTDT", cond: hasBreakdownLogs },
          { step: 4, label: "Production Output" },
        ]
          .filter((s) => s.cond !== false)
          .map((s, idx, arr) => {
            const mappedStep = s.step === 3 ? 3 : s.step === 4 && !hasBreakdownLogs ? 3 : s.step;
            const isCompleted = activeStep > s.step || (activeStep === 3 && s.step === 2);
            const isActive = activeStep === s.step;

            return (
              <React.Fragment key={s.step}>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border transition-all ${isCompleted
                        ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                        : isActive
                          ? "bg-cyan-500 text-zinc-950 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                          : "bg-[#0d1117] text-zinc-500 border-[#30363d]"
                      }`}
                  >
                    {isCompleted ? <CheckCircle className="w-4 h-4 text-cyan-400" /> : idx + 1}
                  </div>
                  <span className={`text-xs font-semibold hidden sm:inline ${isActive ? "text-cyan-400" : "text-zinc-400"}`}>
                    {s.label}
                  </span>
                </div>
                {idx < arr.length - 1 && <div className="flex-1 h-[2px] bg-[#30363d] mx-4 hidden sm:block" />}
              </React.Fragment>
            );
          })}
      </div>

      {/* Error Messaging inside view */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
          <AlertTriangle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}

      {/* WIZARD CONTAINER CARDS */}
      <div className="bg-[#161b22] border border-[#30363d] rounded-xl overflow-hidden shadow-2xl p-6 md:p-8">
        {/* STEP 1: IDENTITY & MAN POWER */}
        {activeStep === 1 && (
          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-bold text-zinc-100 border-b border-[#30363d] pb-3">Step 1: OKP Identity & Man Power</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* OKP Number */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">OKP Number *</label>
                <input
                  type="text"
                  placeholder="e.g., #2405-1A"
                  value={okpNumber}
                  onChange={(e) => setOkpNumber(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                />
              </div>

              {/* Date */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Date *</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/50 transition-all"
                  />
                </div>
              </div>

              {/* Shift */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Shift *</label>
                <select
                  value={shift}
                  onChange={(e) => setShift(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/50 transition-all"
                >
                  <option value="1">Shift 1 (Pagi)</option>
                  <option value="2">Shift 2 (Sore)</option>
                  <option value="3">Shift 3 (Malam)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Machine Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Production Line (Machine) *</label>
                <select
                  value={machineId}
                  onChange={(e) => setMachineId(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/50 transition-all"
                >
                  <option value="">-- Pilih Mesin --</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Product Selection */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Product *</label>
                <select
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/50 transition-all"
                >
                  <option value="">-- Pilih Produk --</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.productCode ? `(${p.productCode})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* Loading Time */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Loading Time (Minutes) *</label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-zinc-500" />
                  <input
                    type="number"
                    value={loadingTime}
                    onChange={(e) => setLoadingTime(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/50 transition-all font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Man Power Fields */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-[#30363d] pt-5 mt-2">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Group Leader</label>
                <input
                  type="text"
                  placeholder="e.g., John Doe"
                  value={groupLeader}
                  onChange={(e) => setGroupLeader(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Operator</label>
                <input
                  type="text"
                  placeholder="e.g., Alan Smith"
                  value={operator}
                  onChange={(e) => setOperator(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Helper</label>
                <input
                  type="text"
                  placeholder="e.g., Bob Lee"
                  value={helper}
                  onChange={(e) => setHelper(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ACTIVITIES & TIME PROCESS */}
        {activeStep === 2 && (
          <div className="flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-[#30363d] pb-3">
              <h3 className="text-lg font-bold text-zinc-100">Step 2: Activity Logs & Downtime</h3>
              {/* Dynamic Running Time tracker */}
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-xs font-bold text-zinc-400">LOADING TIME LOGS:</span>
                <span
                  className={`px-3 py-1 font-mono font-bold text-xs rounded border transition-all ${Math.abs(remainingTime) < 0.01
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                >
                  {sumDurations} / {loadingTime} mins ({remainingTime}m left)
                </span>
                {remainingTime > 0 && (
                  <button
                    type="button"
                    onClick={handleAutoFillProductiveRun}
                    className="px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-zinc-950 font-bold text-[10px] rounded transition-all cursor-pointer shadow-md uppercase tracking-wider flex items-center gap-1 font-mono border border-emerald-400/20"
                    title="Alokasikan sisa waktu sebagai Productive Run (PR)"
                  >
                    Auto-Fill Run Time ({remainingTime}m)
                  </button>
                )}
              </div>
            </div>

            {/* Quick entry form row */}
            <div className="bg-[#0d1117] p-4 rounded-xl border border-[#30363d] flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex flex-col gap-1 md:col-span-2">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Activity Code *</label>
                  <SearchableGroupedSelect
                    value={selectedActCodeId}
                    onChange={(val) => setSelectedActCodeId(val)}
                    options={activityCodes}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Duration (Mins) *</label>
                  <input
                    type="number"
                    placeholder="e.g., 30"
                    value={actDuration}
                    onChange={(e) => setActDuration(e.target.value)}
                    className="px-3.5 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-zinc-100 font-mono"
                  />
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddActivity}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-zinc-950 font-bold rounded-lg text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Log Activity
                  </button>
                </div>
              </div>

              {/* Optional timestamps */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 border-t border-zinc-800 pt-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Start Time (Optional)</label>
                  <input
                    type="time"
                    value={actStart}
                    onChange={(e) => setActStart(e.target.value)}
                    className="px-3.5 py-1.5 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-zinc-400 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">End Time (Optional)</label>
                  <input
                    type="time"
                    value={actEnd}
                    onChange={(e) => setActEnd(e.target.value)}
                    className="px-3.5 py-1.5 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-zinc-400 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* List of Added logs */}
            <div className="bg-[#0d1117] border border-[#30363d] rounded-xl overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-800/20 border-b border-[#30363d] text-zinc-500 text-[10px] font-bold uppercase tracking-wider">
                    <th className="py-3 px-5 text-center w-12">No</th>
                    <th className="py-3 px-5">Code</th>
                    <th className="py-3 px-5">Description</th>
                    <th className="py-3 px-5 text-center w-24">Category</th>
                    <th className="py-3 px-5 text-right w-28">Duration</th>
                    <th className="py-3 px-5 text-center w-24">Time range</th>
                    <th className="py-3 px-5 text-center w-16">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 text-xs text-zinc-300">
                  {activityList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-zinc-500 italic">
                        Belum ada aktivitas yang dicatat. Harap isi form di atas untuk menjumlahkan durasi Loading Time.
                      </td>
                    </tr>
                  ) : (
                    activityList.map((act, idx) => (
                      <tr key={idx} className="hover:bg-zinc-800/10">
                        <td className="py-3.5 px-5 text-center text-zinc-500 font-semibold">{idx + 1}</td>
                        <td className="py-3.5 px-5 font-mono text-xs font-semibold text-cyan-400">{act.code.toUpperCase()}</td>
                        <td className="py-3.5 px-5 font-medium">{act.description}</td>
                        <td className="py-3.5 px-5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold border ${act.categoryCode === "PR"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : act.categoryCode === "BR"
                                  ? "bg-red-500/10 text-red-400 border-red-500/20"
                                  : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                              }`}
                          >
                            {act.categoryCode}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-right font-mono font-bold text-zinc-100">
                          {act.duration} <span className="text-[9px] text-zinc-500">mins</span>
                        </td>
                        <td className="py-3.5 px-5 text-center font-mono text-zinc-400">
                          {act.startTime || act.endTime ? `${act.startTime || "-"} s.d ${act.endTime || "-"}` : "-"}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveActivity(idx)}
                            className="p-1 text-zinc-500 hover:text-red-400 rounded transition-all cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STEP 3: BREAKDOWN MTDT DETAIL (CONDITIONAL) */}
        {activeStep === 3 && (
          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-bold text-zinc-100 border-b border-[#30363d] pb-3">
              Step 3: Engineering Breakdown (MTDT) Details
            </h3>
            <p className="text-xs text-zinc-400">
              Harap isi detail durasi perbaikan engineering (*Mean Time to Diagnostic/Repair*) untuk masing-masing downtime breakdown:
            </p>

            <div className="flex flex-col gap-4">
              {activityList.map((act, idx) => {
                if (act.categoryCode !== "BR") return null;

                const wait = parseFloat(act.brMtdtWaiting || "0");
                const repair = parseFloat(act.brMtdtRepair || "0");
                const start = parseFloat(act.brMtdtStartup || "0");
                const totalMtdt = wait + repair + start;
                const limit = parseFloat(act.duration);

                return (
                  <div
                    key={idx}
                    className="p-5 bg-[#0d1117] border border-[#30363d] rounded-xl flex flex-col gap-4"
                  >
                    {/* Header */}
                    <div className="flex justify-between items-center border-b border-zinc-800 pb-2">
                      <span className="text-xs font-bold text-zinc-300">
                        DOWNTIME LOG: <span className="font-mono text-red-400">[{act.code.toUpperCase()}]</span> {act.description}
                      </span>
                      <span className="font-mono text-xs text-zinc-400">
                        Duration: <span className="text-zinc-100 font-bold">{act.duration} mins</span>
                      </span>
                    </div>

                    {/* Form inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Waiting Tech */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Waiting Technician (Mins)</label>
                        <input
                          type="number"
                          value={act.brMtdtWaiting || "0"}
                          onChange={(e) => handleUpdateBreakdown(idx, "brMtdtWaiting", e.target.value)}
                          className="px-3.5 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-zinc-100 font-mono"
                        />
                      </div>

                      {/* Repair time */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Repair / Maintenance (Mins)</label>
                        <input
                          type="number"
                          value={act.brMtdtRepair || "0"}
                          onChange={(e) => handleUpdateBreakdown(idx, "brMtdtRepair", e.target.value)}
                          className="px-3.5 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-zinc-100 font-mono"
                        />
                      </div>

                      {/* Startup time */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Startup & Trial Test (Mins)</label>
                        <input
                          type="number"
                          value={act.brMtdtStartup || "0"}
                          onChange={(e) => handleUpdateBreakdown(idx, "brMtdtStartup", e.target.value)}
                          className="px-3.5 py-2 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-zinc-100 font-mono"
                        />
                      </div>

                      {/* Root Cause Dropdown */}
                      <div className="flex flex-col gap-1">
                        <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Root Cause Category</label>
                        <select
                          value={act.brRootCause || "8 Basic Competency"}
                          onChange={(e) => handleUpdateBreakdown(idx, "brRootCause", e.target.value)}
                          className="px-3.5 py-2.5 bg-[#161b22] border border-[#30363d] rounded-lg text-xs text-zinc-100 focus:outline-none"
                        >
                          <option value="8 Basic Competency">8 Basic Competency</option>
                          <option value="4M">4M (Man, Machine, Material, Method)</option>
                          <option value="AM/PM">AM / PM Division</option>
                        </select>
                      </div>
                    </div>

                    {/* MTDT validation summary */}
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-zinc-800/40 text-[10px]">
                      <span className="text-zinc-500">MTDT Sum = Waiting + Repair + Startup</span>
                      <span
                        className={`font-semibold font-mono ${totalMtdt > limit ? "text-red-400" : "text-emerald-400"
                          }`}
                      >
                        Total MTDT: {totalMtdt}m / Limit: {limit}m
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 4: PRODUCTION OUTPUT */}
        {activeStep === 4 && (
          <div className="flex flex-col gap-6">
            <h3 className="text-lg font-bold text-zinc-100 border-b border-[#30363d] pb-3">Step 4: Quality & Production Output</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Form inputs */}
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wide">Finished Goods (FG) Output (CB) *</label>
                  <input
                    type="number"
                    placeholder="e.g., 2500"
                    value={totalOutput}
                    onChange={(e) => setTotalOutput(e.target.value)}
                    required
                    className="px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-sm text-zinc-100 focus:outline-none font-mono"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Sample QC (FB)</label>
                    <input
                      type="number"
                      placeholder="e.g., 5"
                      value={sampleQc}
                      onChange={(e) => setSampleQc(e.target.value)}
                      className="px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs text-zinc-100 font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Rework (Kg)</label>
                    <input
                      type="number"
                      placeholder="e.g., 10"
                      value={rework}
                      onChange={(e) => setRework(e.target.value)}
                      className="px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs text-zinc-100 font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">Reject (Kg)</label>
                    <input
                      type="number"
                      placeholder="e.g., 12"
                      value={reject}
                      onChange={(e) => setReject(e.target.value)}
                      className="px-3.5 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-xs text-zinc-100 font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Dynamic performance statistics preview card */}
              <div className="bg-[#0d1117] p-5 rounded-xl border border-[#30363d] flex flex-col justify-between shadow-inner">
                <div>
                  <h4 className="text-xs font-bold text-zinc-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Package className="w-3.5 h-3.5 text-cyan-400" />
                    Machine OEE Performance Estimate
                  </h4>
                  {activeProductObj ? (
                    <div className="flex flex-col gap-2.5 text-xs text-zinc-300">
                      <div className="flex justify-between">
                        <span>Standard Speed:</span>
                        <span className="font-mono font-semibold text-zinc-100">{activeProductObj.standarSpeed} pcs/min</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Active Product:</span>
                        <span className="font-semibold text-zinc-100">{activeProductObj.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Productive Run Time:</span>
                        <span className="font-mono font-semibold text-zinc-100">
                          {activityList.filter((act) => act.categoryCode === "PR").reduce((sum, act) => sum + parseFloat(act.duration), 0)} mins
                        </span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500 italic">Harap pilih Produk di Step 1 untuk memuat perhitungan speed target.</p>
                  )}
                </div>

                {/* Big neon gauge stat */}
                {estimatedPerformanceRate() !== null && (
                  <div className="border-t border-zinc-800/60 pt-4 mt-4 flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase">Estimated Performance Rate:</span>
                    <span className="text-xl font-bold font-mono text-cyan-400 tracking-tight shadow-sm">
                      {estimatedPerformanceRate()}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ACTIONS / WIZARD STEP NAV BUTTONS */}
        <div className="flex justify-between border-t border-[#30363d] pt-6 mt-8">
          {/* Back button */}
          {activeStep > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-zinc-300 font-bold rounded-lg text-sm transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          ) : (
            <div />
          )}

          {/* Next / Save buttons */}
          {activeStep < totalSteps ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex items-center gap-1.5 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-zinc-950 font-bold rounded-lg text-sm shadow-[0_0_15px_rgba(6,182,212,0.2)] transition-all cursor-pointer"
            >
              Next Step
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-6 py-2.5 bg-cyan-500 hover:bg-cyan-400 active:bg-cyan-600 text-zinc-950 font-bold rounded-lg text-sm shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Saving Transaction..." : "Save Production Log"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
