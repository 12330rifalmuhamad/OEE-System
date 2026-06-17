"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Save,
  AlertTriangle,
  CheckCircle,
  Cpu,
  Package,
  Calendar,
  Clock,
  Edit3,
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

export default function EditOKPLogPage() {
  const router = useRouter();
  const { id } = useParams() as { id: string };

  // Masters fetched from API
  const [machines, setMachines] = useState<Machine[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  // Page states
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form Fields
  const [okpNumber, setOkpNumber] = useState("");
  const [date, setDate] = useState("");
  const [shift, setShift] = useState("1");
  const [machineId, setMachineId] = useState("");
  const [productId, setProductId] = useState("");
  const [groupLeader, setGroupLeader] = useState("");
  const [operator, setOperator] = useState("");
  const [helper, setHelper] = useState("");
  const [loadingTime, setLoadingTime] = useState("480");
  const [totalOutput, setTotalOutput] = useState("");
  const [sampleQc, setSampleQc] = useState("");
  const [rework, setRework] = useState("");
  const [reject, setReject] = useState("");

  // Fetch Master Data & Details on Mount
  useEffect(() => {
    async function loadMastersAndDetails() {
      setLoading(true);
      setErrorMsg("");
      try {
        const [resMach, resProd, resDetail] = await Promise.all([
          fetch("/api/master/machines"),
          fetch("/api/master/products"),
          fetch(`/api/transactions/okp/${id}`),
        ]);

        if (resMach.ok) setMachines((await resMach.json()).machines);
        if (resProd.ok) setProducts((await resProd.json()).products);

        if (resDetail.ok) {
          const data = await resDetail.json();
          const log = data.okpLog;
          setOkpNumber(log.okpNumber);
          setDate(new Date(log.date).toISOString().split("T")[0]);
          setShift(String(log.shift));
          setMachineId(String(log.machineId));
          setProductId(String(log.productId));
          setGroupLeader(log.groupLeader || "");
          setOperator(log.operator || "");
          setHelper(log.helper || "");
          setLoadingTime(String(log.loadingTime));
          setTotalOutput(String(log.totalOutput));
          setRework(String(log.rework));
          setReject(String(log.reject));
          setSampleQc(log.sampleQc ? String(log.sampleQc) : "");
        } else {
          setErrorMsg("Gagal memuat detail data transaksi OKP.");
        }
      } catch (err) {
        console.error(err);
        setErrorMsg("Kesalahan koneksi saat menghubungi server.");
      } finally {
        setLoading(false);
      }
    }
    loadMastersAndDetails();
  }, [id]);

  // Submit Updated Transaction
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");
    setIsSubmitting(true);

    if (!okpNumber || !machineId || !productId || !loadingTime || !totalOutput) {
      setErrorMsg("Harap lengkapi semua kolom wajib (*).");
      setIsSubmitting(false);
      return;
    }

    const payload = {
      okpNumber,
      date,
      shift: parseInt(shift, 10),
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
    };

    try {
      const res = await fetch(`/api/transactions/okp/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg("Catatan transaksi OKP berhasil diperbarui!");
        setTimeout(() => {
          router.push("/dashboard/transactions");
        }, 1500);
      } else {
        setErrorMsg(data.error || "Gagal memperbarui transaksi.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Terjadi kesalahan jaringan.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center bg-transparent text-[var(--text-secondary)] font-mono py-20">
        <div className="flex flex-col items-center gap-3">
          <Clock className="w-8 h-8 text-[#5ebd56] animate-spin" />
          <span>Memuat formulir edit transaksi OEE...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-5xl mx-auto w-full bg-transparent text-[var(--text-primary)]">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-[var(--border-color)] pb-6">
        <Link
          href="/dashboard/transactions"
          className="p-2 bg-[var(--bg-card)] hover:bg-[var(--hover-bg)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-color)] transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-[#5ebd56]" />
            Edit OKP Log Entry
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">Mengubah data utama identitas shift, man power, dan target total output.</p>
        </div>
      </div>

      {/* Messaging alerts */}
      {errorMsg && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm">
          <AlertTriangle className="w-4 h-4" />
          {errorMsg}
        </div>
      )}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-[#5ebd56] p-4 rounded-lg text-sm font-semibold flex items-center gap-2 shadow-sm">
          <CheckCircle className="w-4 h-4" />
          {successMsg}
        </div>
      )}

      {/* Form Container */}
      <form onSubmit={handleSave} className="flex flex-col gap-6">
        {/* ROW 1: IDENTITY CARD */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 md:p-8 shadow-[var(--card-shadow)] flex flex-col gap-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">OKP Identity & Man Power</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* OKP Number */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">OKP Number *</label>
              <input
                type="text"
                placeholder="e.g., #2405-1A"
                value={okpNumber}
                onChange={(e) => setOkpNumber(e.target.value)}
                className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#5ebd56]/50 transition-all font-mono"
              />
            </div>

            {/* Date */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Date *</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full pl-10-important pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#5ebd56]/50 transition-all"
                />
              </div>
            </div>

            {/* Shift */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Shift *</label>
              <select
                value={shift}
                onChange={(e) => setShift(e.target.value)}
                className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#5ebd56]/50 transition-all"
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
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Production Line (Machine) *</label>
              <select
                value={machineId}
                onChange={(e) => setMachineId(e.target.value)}
                className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#5ebd56]/50 transition-all"
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
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Product *</label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#5ebd56]/50 transition-all"
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
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Loading Time (Minutes) *</label>
              <div className="relative">
                <Clock className="w-4 h-4 absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" />
                <input
                  type="number"
                  value={loadingTime}
                  onChange={(e) => setLoadingTime(e.target.value)}
                  className="w-full pl-10-important pr-4 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#5ebd56]/50 transition-all font-mono"
                />
              </div>
            </div>
          </div>

          {/* Man Power Fields */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 border-t border-[var(--border-color)] pt-5 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Group Leader</label>
              <input
                type="text"
                value={groupLeader}
                onChange={(e) => setGroupLeader(e.target.value)}
                className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#5ebd56]/50 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Operator</label>
              <input
                type="text"
                value={operator}
                onChange={(e) => setOperator(e.target.value)}
                className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#5ebd56]/50 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Helper</label>
              <input
                type="text"
                value={helper}
                onChange={(e) => setHelper(e.target.value)}
                className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#5ebd56]/50 transition-all"
              />
            </div>
          </div>
        </div>

        {/* ROW 2: OUTPUT CARD */}
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-6 md:p-8 shadow-[var(--card-shadow)] flex flex-col gap-6">
          <h3 className="text-lg font-bold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-3">Quality & Production Output</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide">Finished Goods (FG) Output (CB) *</label>
                <input
                  type="number"
                  value={totalOutput}
                  onChange={(e) => setTotalOutput(e.target.value)}
                  className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none font-mono"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Sample QC (FB)</label>
                  <input
                    type="number"
                    value={sampleQc}
                    onChange={(e) => setSampleQc(e.target.value)}
                    className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Rework (Kg)</label>
                  <input
                    type="number"
                    value={rework}
                    onChange={(e) => setRework(e.target.value)}
                    className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] font-mono"
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Reject (Kg)</label>
                  <input
                    type="number"
                    value={reject}
                    onChange={(e) => setReject(e.target.value)}
                    className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Helper Shortcut Box */}
            <div className="bg-[var(--bg-input)]/45 p-5 rounded-xl border border-[var(--border-color)] flex flex-col justify-between">
              <div>
                <h4 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#5ebd56]" />
                  Petunjuk Perubahan Data
                </h4>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  Jika Anda merubah nilai <strong>Loading Time</strong>, pastikan total durasi henti/jalan yang terdaftar di halaman <em>Adjust</em> juga disesuaikan agar nilainya tetap seimbang. 
                </p>
              </div>

              <div className="border-t border-[var(--border-color)]/60 pt-4 mt-4 flex justify-end">
                <Link
                  href={`/dashboard/transactions/${id}/adjust`}
                  className="px-3.5 py-1.5 bg-[var(--bg-input)] hover:bg-[var(--hover-bg)] text-[#5ebd56] font-bold rounded-lg border border-[var(--border-color)] text-xs uppercase tracking-wider transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-sm"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Adjust Activity Logs
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex justify-between border-t border-[var(--border-color)] pt-6 mt-2">
          <Link
            href="/dashboard/transactions"
            className="flex items-center gap-1.5 px-5 py-2.5 bg-[var(--bg-input)] hover:bg-[var(--hover-bg)] active:bg-[var(--hover-bg)]/85 text-[var(--text-primary)] font-bold rounded-lg text-sm transition-all border border-[var(--border-color)] cursor-pointer"
          >
            Batal
          </Link>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-1.5 px-6 py-2.5 bg-[#5ebd56] hover:bg-[#5ebd56]/90 active:bg-[#5ebd56]/80 text-black font-bold rounded-lg text-sm shadow-[0_2px_15px_rgba(94,189,86,0.15)] transition-all cursor-pointer"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? "Menyimpan Perubahan..." : "Simpan Perubahan"}
          </button>
        </div>
      </form>
    </div>
  );
}
