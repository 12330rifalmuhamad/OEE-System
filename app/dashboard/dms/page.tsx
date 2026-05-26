"use client";

import React, { useState, useEffect } from "react";
import {
  Activity,
  Calculator,
  Calendar,
  CheckCircle,
  Clock,
  Cpu,
  Layers,
  ListTodo,
  Plus,
  RefreshCw,
  Settings,
  Trash2,
  AlertCircle,
  X,
  UserCheck,
} from "lucide-react";

interface KpiTarget {
  oeeTarget: number;
  availTarget: number;
  perfTarget: number;
  qualTarget: number;
}

interface DmsAction {
  id: string;
  downtimeCode: string;
  actionPlan: string;
  pic: string;
  targetDate: string | null;
  status: string;
  okpLog?: {
    okpNumber: string;
    machine: { name: string };
    product: { name: string };
  } | null;
}

interface OkpLogOption {
  id: string;
  okpNumber: string;
  date: string;
  machineName: string;
}

export default function DmsBoardPage() {
  const [targets, setTargets] = useState<KpiTarget>({
    oeeTarget: 85,
    availTarget: 90,
    perfTarget: 95,
    qualTarget: 99,
  });
  
  const [actuals, setActuals] = useState({
    oee: 0,
    availability: 0,
    performance: 0,
    quality: 0,
  });

  const [dmsActions, setDmsActions] = useState<DmsAction[]>([]);
  const [okpOptions, setOkpOptions] = useState<OkpLogOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Modals
  const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  // Target Form States
  const [targetOee, setTargetOee] = useState("85");
  const [targetAvail, setTargetAvail] = useState("90");
  const [targetPerf, setTargetPerf] = useState("95");
  const [targetQual, setTargetQual] = useState("99");

  // Action Form States
  const [formDowntimeCode, setFormDowntimeCode] = useState("");
  const [formActionPlan, setFormActionPlan] = useState("");
  const [formPic, setFormPic] = useState("");
  const [formTargetDate, setFormTargetDate] = useState("");
  const [formOkpLogId, setFormOkpLogId] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch Targets
      const targetRes = await fetch("/api/master/kpi-targets");
      if (targetRes.ok) {
        const targetData = await targetRes.json();
        setTargets(targetData.kpiTarget);
        setTargetOee(targetData.kpiTarget.oeeTarget.toString());
        setTargetAvail(targetData.kpiTarget.availTarget.toString());
        setTargetPerf(targetData.kpiTarget.perfTarget.toString());
        setTargetQual(targetData.kpiTarget.qualTarget.toString());
      }

      // 2. Fetch OEE Actuals from analytics
      const analyticsRes = await fetch("/api/analytics/oee");
      if (analyticsRes.ok) {
        const analyticsData = await analyticsRes.json();
        setActuals({
          oee: analyticsData.summary.oee,
          availability: analyticsData.summary.availability,
          performance: analyticsData.summary.performance,
          quality: analyticsData.summary.quality,
        });
      }

      // 3. Fetch DMS Actions
      const dmsRes = await fetch("/api/dms");
      if (dmsRes.ok) {
        const dmsData = await dmsRes.json();
        setDmsActions(dmsData.dmsActions);
      }

      // 4. Fetch OKP Transactions for dropdown links
      const okpRes = await fetch("/api/transactions/okp");
      if (okpRes.ok) {
        const okpData = await okpRes.json();
        const options = okpData.okpLogs.map((log: any) => ({
          id: log.id,
          okpNumber: log.okpNumber,
          date: log.date.split("T")[0],
          machineName: log.machine.name,
        }));
        setOkpOptions(options);
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi saat mengambil data DMS.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUpdateTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      const res = await fetch("/api/master/kpi-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          oeeTarget: parseFloat(targetOee),
          availTarget: parseFloat(targetAvail),
          perfTarget: parseFloat(targetPerf),
          qualTarget: parseFloat(targetQual),
        }),
      });

      if (res.ok) {
        setSuccess("Target KPI berhasil diperbarui!");
        setIsTargetModalOpen(false);
        fetchData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Gagal memperbarui target KPI.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server.");
    }
  };

  const handleCreateAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formDowntimeCode || !formActionPlan || !formPic) {
      setError("Mohon lengkapi seluruh kolom wajib.");
      return;
    }

    try {
      const res = await fetch("/api/dms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          downtimeCode: formDowntimeCode,
          actionPlan: formActionPlan,
          pic: formPic,
          targetDate: formTargetDate || null,
          okpLogId: formOkpLogId || null,
        }),
      });

      if (res.ok) {
        setSuccess("Tindakan korektif DMS berhasil didaftarkan!");
        setIsActionModalOpen(false);
        
        // Reset states
        setFormDowntimeCode("");
        setFormActionPlan("");
        setFormPic("");
        setFormTargetDate("");
        setFormOkpLogId("");

        fetchData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Gagal membuat tindakan DMS.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server.");
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/dms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        setSuccess("Status tindakan berhasil diperbarui!");
        fetchData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Gagal merubah status tindakan.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server.");
    }
  };

  const handleDeleteAction = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tindakan korektif DMS ini?")) return;
    setError("");
    setSuccess("");
    try {
      const res = await fetch(`/api/dms/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccess("Tindakan DMS berhasil dihapus.");
        fetchData();
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError("Gagal menghapus tindakan DMS.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server.");
    }
  };

  // RAG Threshold Helper
  const getRagStyles = (actual: number, target: number) => {
    const diff = actual - target;
    if (diff >= 0) return { dot: "bg-emerald-500", text: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" };
    if (diff >= -10) return { dot: "bg-amber-500", text: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" };
    return { dot: "bg-rose-500", text: "text-rose-400", bg: "bg-rose-500/10 border-rose-500/20" };
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "CLOSED":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
      case "IN_PROGRESS":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/20";
      default:
        return "bg-rose-500/10 text-rose-400 border border-rose-500/20";
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full bg-[#110e1a]">
      
      {/* 1. HEADER PANEL */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#231b33] pb-6">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2.5 font-mono">
            <div className="p-1.5 bg-[#1a1526] rounded-lg border border-[#2e2345] text-[#8e72eb]">
              <Activity className="w-4.5 h-4.5" />
            </div>
            <span>Daily Management System (DMS) Board</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-1">Shopfloor daily stand-up meeting board, plant KPI targets, and active loss countermeasures.</p>
        </div>

        <div className="flex gap-2.5">
          <button
            onClick={() => setIsTargetModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#161224] hover:bg-[#1f1a30] text-zinc-300 border border-[#231b33] font-bold rounded-lg text-xs transition-colors cursor-pointer uppercase font-mono tracking-wider"
          >
            <Settings className="w-4 h-4 text-[#8e72eb]" />
            Set KPI Targets
          </button>
          
          <button
            onClick={() => setIsActionModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#5b3fb8] hover:bg-[#6c4fe3] text-white font-bold rounded-lg text-xs transition-colors cursor-pointer uppercase font-mono tracking-wider"
          >
            <Plus className="w-4 h-4" />
            Log Action Item
          </button>
        </div>
      </div>

      {/* Notifications */}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.05)]">
          <CheckCircle className="w-4 h-4" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-lg text-xs font-semibold flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* 2. RAG KPI STAND-UP CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* AVAILABILITY CARD */}
        {(() => {
          const s = getRagStyles(actuals.availability, targets.availTarget);
          return (
            <div className={`border rounded-xl p-5 flex flex-col justify-between transition-colors ${s.bg}`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-zinc-450">Availability</span>
                <Clock className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="my-3">
                <span className="text-2xl font-bold font-mono text-zinc-100">{actuals.availability}%</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                  <span className={`text-[10px] font-semibold ${s.text}`}>Target: {targets.availTarget}%</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* PERFORMANCE CARD */}
        {(() => {
          const s = getRagStyles(actuals.performance, targets.perfTarget);
          return (
            <div className={`border rounded-xl p-5 flex flex-col justify-between transition-colors ${s.bg}`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-zinc-450">Performance</span>
                <Cpu className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="my-3">
                <span className="text-2xl font-bold font-mono text-zinc-100">{actuals.performance}%</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                  <span className={`text-[10px] font-semibold ${s.text}`}>Target: {targets.perfTarget}%</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* QUALITY CARD */}
        {(() => {
          const s = getRagStyles(actuals.quality, targets.qualTarget);
          return (
            <div className={`border rounded-xl p-5 flex flex-col justify-between transition-colors ${s.bg}`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-zinc-450">Quality</span>
                <Layers className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="my-3">
                <span className="text-2xl font-bold font-mono text-zinc-100">{actuals.quality}%</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                  <span className={`text-[10px] font-semibold ${s.text}`}>Target: {targets.qualTarget}%</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* OEE SUMMARY CARD */}
        {(() => {
          const s = getRagStyles(actuals.oee, targets.oeeTarget);
          return (
            <div className={`border rounded-xl p-5 flex flex-col justify-between transition-colors ${s.bg}`}>
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-zinc-450">Overall OEE</span>
                <Calculator className="w-4 h-4 text-zinc-500" />
              </div>
              <div className="my-3">
                <span className="text-2xl font-bold font-mono text-zinc-100">{actuals.oee}%</span>
                <div className="flex items-center gap-1.5 mt-2">
                  <div className={`w-2 h-2 rounded-full ${s.dot}`} />
                  <span className={`text-[10px] font-semibold ${s.text}`}>Target: {targets.oeeTarget}%</span>
                </div>
              </div>
            </div>
          );
        })()}

      </div>

      {/* 3. DMS BOARD CORRECTIVE ACTION LOGS */}
      <div className="bg-[#161224] border border-[#231b33] rounded-xl overflow-hidden shadow-md">
        
        {/* Table Header block */}
        <div className="p-5 border-b border-[#231b33] bg-[#0b0911]/50 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ListTodo className="w-4 h-4 text-[#8e72eb]" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-200 font-mono">
              Loss Countermeasure Action Log (DMS Board)
            </h3>
          </div>
          <button
            onClick={fetchData}
            className="p-1.5 bg-[#0b0911] hover:bg-[#1a1526] border border-[#231b33] rounded-lg text-zinc-450 hover:text-zinc-200 transition-colors cursor-pointer"
            title="Refresh List"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Action Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#0b0911] border-b border-[#231b33] text-zinc-500 font-semibold uppercase tracking-wider">
                <th className="py-4 px-6 w-14 text-center">No</th>
                <th className="py-4 px-6 w-32">Downtime Code</th>
                <th className="py-4 px-6">Countermeasure Action Plan</th>
                <th className="py-4 px-6 w-40">PIC (Assigned)</th>
                <th className="py-4 px-6 w-32">Target Date</th>
                <th className="py-4 px-6 w-24">Link OKP</th>
                <th className="py-4 px-6 w-36 text-center">Status Control</th>
                <th className="py-4 px-6 w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#231b33] text-zinc-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500 font-medium">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#8e72eb] mb-2" />
                    Fetching DMS board status...
                  </td>
                </tr>
              ) : dmsActions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500 font-medium italic">
                    No active countermeasure actions logged. Click "Log Action Item" to register one.
                  </td>
                </tr>
              ) : (
                dmsActions.map((action, idx) => (
                  <tr key={action.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="py-4 px-6 text-center text-zinc-650 font-bold">{idx + 1}</td>
                    
                    {/* Downtime Code Badge */}
                    <td className="py-4 px-6">
                      <span className="font-mono bg-[#0b0911] px-2 py-1 rounded text-xs text-rose-400 border border-[#231b33]">
                        {action.downtimeCode}
                      </span>
                    </td>

                    {/* Countermeasure Plan Text */}
                    <td className="py-4 px-6 font-semibold text-zinc-200 leading-normal">
                      {action.actionPlan}
                    </td>

                    {/* PIC */}
                    <td className="py-4 px-6 text-zinc-300 flex items-center gap-1.5 mt-2 border-none">
                      <UserCheck className="w-3.5 h-3.5 text-zinc-600" />
                      <span className="font-bold">{action.pic}</span>
                    </td>

                    {/* Target Date */}
                    <td className="py-4 px-6 font-mono text-zinc-500">
                      {action.targetDate ? action.targetDate.split("T")[0] : "-"}
                    </td>

                    {/* Linked OKP */}
                    <td className="py-4 px-6">
                      {action.okpLog ? (
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono font-bold text-[#8e72eb]">{action.okpLog.okpNumber}</span>
                          <span className="text-[9px] text-zinc-600 font-medium">{action.okpLog.machine.name}</span>
                        </div>
                      ) : (
                        <span className="text-zinc-650 font-bold font-mono">-</span>
                      )}
                    </td>

                    {/* Interactive Status Selector */}
                    <td className="py-4 px-6 text-center">
                      <select
                        value={action.status}
                        onChange={(e) => handleStatusChange(action.id, e.target.value)}
                        className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase cursor-pointer focus:outline-none transition-colors ${getStatusBadge(
                          action.status
                        )}`}
                      >
                        <option value="OPEN" className="bg-[#110e1a] text-rose-400">Open</option>
                        <option value="IN_PROGRESS" className="bg-[#110e1a] text-amber-400">In Progress</option>
                        <option value="CLOSED" className="bg-[#110e1a] text-emerald-400">Closed</option>
                      </select>
                    </td>

                    {/* Actions Column */}
                    <td className="py-4 px-6 text-center">
                      <button
                        onClick={() => handleDeleteAction(action.id)}
                        className="p-1.5 bg-[#0b0911] hover:bg-rose-500/10 border border-[#231b33] text-zinc-500 hover:text-rose-400 rounded transition-colors cursor-pointer"
                        title="Delete Countermeasure"
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

      {/* MODAL: SET TARGET KPI */}
      {isTargetModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161224] border border-[#231b33] rounded-xl max-w-sm w-full overflow-hidden shadow-2xl relative">
            <div className="flex justify-between items-center p-5 border-b border-[#231b33] bg-[#0b0911]">
              <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-100 font-mono">
                Set Plant KPI Targets
              </h3>
              <button
                onClick={() => setIsTargetModalOpen(false)}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-550 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTargets} className="p-6 space-y-4 text-xs">
              
              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-zinc-500 uppercase tracking-wider font-mono text-[9px] px-1">OEE Target (%)</span>
                <input
                  type="number"
                  step="0.1"
                  value={targetOee}
                  onChange={(e) => setTargetOee(e.target.value)}
                  required
                  className="px-3.5 py-2.5 bg-[#0b0911] border border-[#231b33] rounded-lg text-xs text-zinc-155 focus:outline-none focus:border-[#5b3fb8] transition-colors font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-zinc-500 uppercase tracking-wider font-mono text-[9px] px-1">Availability Target (%)</span>
                <input
                  type="number"
                  step="0.1"
                  value={targetAvail}
                  onChange={(e) => setTargetAvail(e.target.value)}
                  required
                  className="px-3.5 py-2.5 bg-[#0b0911] border border-[#231b33] rounded-lg text-xs text-zinc-155 focus:outline-none focus:border-[#5b3fb8] transition-colors font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-zinc-500 uppercase tracking-wider font-mono text-[9px] px-1">Performance Target (%)</span>
                <input
                  type="number"
                  step="0.1"
                  value={targetPerf}
                  onChange={(e) => setTargetPerf(e.target.value)}
                  required
                  className="px-3.5 py-2.5 bg-[#0b0911] border border-[#231b33] rounded-lg text-xs text-zinc-155 focus:outline-none focus:border-[#5b3fb8] transition-colors font-mono"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-zinc-500 uppercase tracking-wider font-mono text-[9px] px-1">Quality Target (%)</span>
                <input
                  type="number"
                  step="0.1"
                  value={targetQual}
                  onChange={(e) => setTargetQual(e.target.value)}
                  required
                  className="px-3.5 py-2.5 bg-[#0b0911] border border-[#231b33] rounded-lg text-xs text-zinc-155 focus:outline-none focus:border-[#5b3fb8] transition-colors font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-[#231b33] pt-5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsTargetModalOpen(false)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-lg text-xs uppercase font-mono tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#5b3fb8] hover:bg-[#6c4fe3] text-white font-bold rounded-lg text-xs uppercase font-mono tracking-wider cursor-pointer"
                >
                  Save Targets
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: LOG ACTION ITEM (COUNTERMEASURE) */}
      {isActionModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#161224] border border-[#231b33] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl relative">
            <div className="flex justify-between items-center p-5 border-b border-[#231b33] bg-[#0b0911]">
              <h3 className="font-bold text-sm uppercase tracking-wider text-zinc-100 font-mono">
                Log Countermeasure Action
              </h3>
              <button
                onClick={() => setIsActionModalOpen(false)}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-550 hover:text-zinc-300 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAction} className="p-6 space-y-4 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Downtime Code */}
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-zinc-500 uppercase tracking-wider font-mono text-[9px] px-1">Downtime Code *</span>
                  <input
                    type="text"
                    placeholder="e.g., BR.007"
                    value={formDowntimeCode}
                    onChange={(e) => setFormDowntimeCode(e.target.value)}
                    required
                    className="px-3.5 py-2.5 bg-[#0b0911] border border-[#231b33] rounded-lg text-xs text-zinc-155 placeholder-zinc-700 focus:outline-none focus:border-[#5b3fb8] transition-colors font-mono"
                  />
                </div>

                {/* PIC */}
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-zinc-500 uppercase tracking-wider font-mono text-[9px] px-1">Assigned PIC *</span>
                  <input
                    type="text"
                    placeholder="e.g., Budi (Maintenance)"
                    value={formPic}
                    onChange={(e) => setFormPic(e.target.value)}
                    required
                    className="px-3.5 py-2.5 bg-[#0b0911] border border-[#231b33] rounded-lg text-xs text-zinc-155 placeholder-zinc-700 focus:outline-none focus:border-[#5b3fb8] transition-colors"
                  />
                </div>
              </div>

              {/* Action Plan */}
              <div className="flex flex-col gap-1.5">
                <span className="font-bold text-zinc-500 uppercase tracking-wider font-mono text-[9px] px-1">Countermeasure Action Plan *</span>
                <textarea
                  placeholder="Deskripsikan rencana tindakan perbaikan (countermeasure) secara rinci..."
                  value={formActionPlan}
                  onChange={(e) => setFormActionPlan(e.target.value)}
                  required
                  rows={3}
                  className="px-3.5 py-2.5 bg-[#0b0911] border border-[#231b33] rounded-lg text-xs text-zinc-155 placeholder-zinc-700 focus:outline-none focus:border-[#5b3fb8] transition-colors resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Target Date */}
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-zinc-500 uppercase tracking-wider font-mono text-[9px] px-1">Target Date</span>
                  <input
                    type="date"
                    value={formTargetDate}
                    onChange={(e) => setFormTargetDate(e.target.value)}
                    className="px-3.5 py-2.5 bg-[#0b0911] border border-[#231b33] rounded-lg text-xs text-zinc-155 focus:outline-none focus:border-[#5b3fb8] transition-colors font-mono cursor-pointer"
                  />
                </div>

                {/* Link to OKP Transaction */}
                <div className="flex flex-col gap-1.5">
                  <span className="font-bold text-zinc-500 uppercase tracking-wider font-mono text-[9px] px-1">Link to OKP Run</span>
                  <select
                    value={formOkpLogId}
                    onChange={(e) => setFormOkpLogId(e.target.value)}
                    className="px-3.5 py-2.5 bg-[#0b0911] border border-[#231b33] rounded-lg text-xs text-zinc-155 focus:outline-none focus:border-[#5b3fb8] transition-colors cursor-pointer"
                  >
                    <option value="">Tidak Dikaitkan</option>
                    {okpOptions.map((opt) => (
                      <option key={opt.id} value={opt.id}>
                        {opt.okpNumber} ({opt.machineName} - {opt.date})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#231b33] pt-5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsActionModalOpen(false)}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold rounded-lg text-xs uppercase font-mono tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#5b3fb8] hover:bg-[#6c4fe3] text-white font-bold rounded-lg text-xs uppercase font-mono tracking-wider cursor-pointer"
                >
                  Log Action Plan
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
