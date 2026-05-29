"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, X, RefreshCw, AlertCircle, GitCommit, Check } from "lucide-react";

interface Machine {
  id: number;
  name: string;
  lineProcessId?: number | null;
}

interface LineProcess {
  id: number;
  name: string;
  createdAt: string;
  machines: { id: number; name: string }[];
}

export default function LineProcessMasterPage() {
  const [lines, setLines] = useState<LineProcess[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");
  const [selectedLineId, setSelectedLineId] = useState<number | null>(null);

  // Form states
  const [formName, setFormName] = useState("");
  const [selectedMachineIds, setSelectedMachineIds] = useState<number[]>([]);

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch Lines
      const resLines = await fetch("/api/master/line-processes");
      let linesData: LineProcess[] = [];
      if (resLines.ok) {
        const data = await resLines.json();
        linesData = data.lineProcesses || [];
        setLines(linesData);
      } else {
        const data = await resLines.json();
        setError(data.error || "Gagal memuat daftar line process.");
        setLoading(false);
        return;
      }

      // 2. Fetch Machines
      const resMachines = await fetch("/api/master/machines");
      if (resMachines.ok) {
        const data = await resMachines.json();
        setMachines(data.machines || []);
      } else {
        setError("Gagal memuat daftar mesin pendukung.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filter based on search query
  const filteredLines = lines.filter((l) =>
    l.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open modal for adding
  const handleOpenAdd = () => {
    setModalMode("ADD");
    setSelectedLineId(null);
    setFormName("");
    setSelectedMachineIds([]);
    setError("");
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (l: LineProcess) => {
    setModalMode("EDIT");
    setSelectedLineId(l.id);
    setFormName(l.name);
    setSelectedMachineIds(l.machines.map((m) => m.id));
    setError("");
    setIsModalOpen(true);
  };

  // Toggle machine selection in checklist
  const handleToggleMachine = (id: number) => {
    setSelectedMachineIds((prev) =>
      prev.includes(id) ? prev.filter((mId) => mId !== id) : [...prev, id]
    );
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!formName.trim()) {
      setError("Nama line process wajib diisi.");
      return;
    }

    try {
      let url = "/api/master/line-processes";
      let method = "POST";

      if (modalMode === "EDIT" && selectedLineId) {
        url = `/api/master/line-processes/${selectedLineId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formName.trim(),
          machineIds: selectedMachineIds,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message || "Aksi berhasil.");
        setIsModalOpen(false);
        fetchData(); // reload
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.error || "Gagal memproses data lini.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server.");
    }
  };

  // Delete line process
  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus lini proses ini? Mesin yang tergabung di dalamnya tidak akan terhapus, melainkan hanya akan dilepas relasinya.")) return;
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/master/line-processes/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message || "Line process berhasil dihapus.");
        fetchData();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.error || "Gagal menghapus line process.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server.");
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full bg-transparent text-[var(--text-primary)] animate-fadeIn">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border-color)] pb-5">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5 font-mono">
            <GitCommit className="w-5 h-5 text-[#5ebd56]" />
            Master Data: Line Processes
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">Mengelola daftar lini proses produksi aktif di lantai pabrik Anda.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#5ebd56] hover:bg-[#53a74c] text-black font-extrabold rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-[0_2px_8px_rgba(94,189,86,0.1)] animate-fadeIn"
        >
          <Plus className="w-3.5 h-3.5" />
          Add New Line Process
        </button>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-[#5ebd56] p-4 rounded-lg text-xs font-semibold flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          {successMsg}
        </div>
      )}
      {error && !isModalOpen && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-4 rounded-lg text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Search & Actions Utility */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[var(--bg-card)] border border-[var(--border-color)] p-4 rounded-xl shadow-[var(--card-shadow)]">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)]" />
          <input
            type="text"
            placeholder="Search lines by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[#5ebd56] font-mono transition-all"
          />
        </div>
        <button
          onClick={fetchData}
          className="p-2 bg-[var(--bg-input)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          title="Reload Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Data Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-[var(--card-shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--bg-sidebar)]/30 border-b border-[var(--border-color)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider font-mono">
                <th className="py-4 px-6 text-center w-16">No</th>
                <th className="py-4 px-6">Line ID</th>
                <th className="py-4 px-6">Line Name</th>
                <th className="py-4 px-6">Grouped Machines</th>
                <th className="py-4 px-6">Date Registered</th>
                <th className="py-4 px-6 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)] font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-secondary)] italic">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#5ebd56] mb-2" />
                    Memuat data lini proses...
                  </td>
                </tr>
              ) : filteredLines.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-secondary)] italic font-sans font-medium">
                    Tidak ada data lini proses ditemukan.
                  </td>
                </tr>
              ) : (
                filteredLines.map((l, idx) => (
                  <tr key={l.id} className="hover:bg-[var(--hover-bg)]/20 transition-all border-b border-[var(--border-color)]/40">
                    <td className="py-4 px-6 text-center text-[var(--text-secondary)] font-semibold">{idx + 1}</td>
                    <td className="py-4 px-6">
                      <span className="font-mono bg-[var(--bg-input)] px-2.5 py-1 rounded text-xs text-[#5ebd56] border border-[var(--border-color)] font-bold">
                        {l.id}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-[var(--text-primary)] font-sans">{l.name}</td>
                    <td className="py-4 px-6">
                      <div className="flex flex-wrap gap-1.5 max-w-md">
                        {l.machines && l.machines.length > 0 ? (
                          l.machines.map((m) => (
                            <span
                              key={m.id}
                              className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-[#5ebd56]/15 text-[#2c7a25] dark:text-[#5ebd56] border border-[#5ebd56]/30 font-sans"
                            >
                              {m.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] text-[var(--text-secondary)] italic font-sans">Belum ada mesin dikaitkan</span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[var(--text-secondary)]">
                      {new Date(l.createdAt).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleOpenEdit(l)}
                          className="p-1.5 bg-[var(--bg-input)] hover:bg-[#5ebd56]/10 border border-[var(--border-color)] hover:border-[#5ebd56]/30 text-[var(--text-secondary)] hover:text-[#5ebd56] rounded transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(l.id)}
                          className="p-1.5 bg-[var(--bg-input)] hover:bg-rose-500/10 border border-[var(--border-color)] hover:border-rose-500/30 text-[var(--text-secondary)] hover:text-rose-500 rounded transition-all cursor-pointer"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* DIALOG MODAL ADD / EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/40">
              <h3 className="font-bold text-sm text-[var(--text-primary)] font-mono uppercase tracking-wider flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-[#5ebd56]" />
                {modalMode === "ADD" ? "Add New Line Process" : "Edit Line Process Settings"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-[var(--hover-bg)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 font-mono">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Line Process Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Nama Lini Proses *</label>
                <input
                  type="text"
                  placeholder="e.g., Packaging Line A"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:outline-none focus:border-[#5ebd56] font-sans transition-all"
                />
              </div>

              {/* Machine Selection Checklist */}
              <div className="flex flex-col gap-1.5 mt-1">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide flex justify-between items-center">
                  <span>Pilih Mesin Lini Produksi</span>
                  <span className="text-[9px] text-[#5ebd56] lowercase font-normal italic">*mesin hanya bisa berada di satu lini</span>
                </label>
                
                <div className="border border-[var(--border-color)] bg-[var(--bg-input)] rounded-lg p-3 max-h-48 overflow-y-auto flex flex-col gap-2 font-sans">
                  {machines.length === 0 ? (
                    <div className="text-xs text-[var(--text-secondary)] italic text-center py-4">
                      Belum ada data mesin terdaftar. Daftarkan mesin di Master Mesin terlebih dahulu.
                    </div>
                  ) : (
                    machines.map((m) => {
                      const isSelected = selectedMachineIds.includes(m.id);
                      // Check if machine is assigned to another line process
                      const assignedLine = lines.find((l) => l.id !== selectedLineId && l.machines.some((lm) => lm.id === m.id));
                      
                      return (
                        <div
                          key={m.id}
                          onClick={() => handleToggleMachine(m.id)}
                          className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs cursor-pointer select-none transition-all ${
                            isSelected
                              ? "bg-[#5ebd56]/15 border-[#5ebd56]/40 text-[#2c7a25] dark:text-[#5ebd56]"
                              : "bg-[var(--bg-card)] border-[var(--border-color)] text-[var(--text-primary)] hover:bg-[var(--hover-bg)]"
                          }`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="font-semibold">{m.name}</span>
                            {assignedLine && (
                              <span className="text-[9px] text-rose-500 font-medium">
                                Saat ini di: {assignedLine.name}
                              </span>
                            )}
                          </div>
                          
                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${
                            isSelected
                              ? "bg-[#5ebd56] border-[#5ebd56] text-black"
                              : "border-[var(--border-color)]"
                          }`}>
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 border-t border-[var(--border-color)] pt-5 mt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[var(--bg-input)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold rounded-lg text-xs transition-all cursor-pointer font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5ebd56] hover:bg-[#53a74c] text-black font-bold rounded-lg text-xs transition-all cursor-pointer font-mono"
                >
                  {modalMode === "ADD" ? "Create Line" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
