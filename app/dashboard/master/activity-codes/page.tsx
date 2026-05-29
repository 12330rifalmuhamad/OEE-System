"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  X,
  RefreshCw,
  AlertCircle,
  Hash,
  Layers,
  Upload,
  FileSpreadsheet,
  CheckCircle,
} from "lucide-react";

interface ActivityCategory {
  id: string;
  code: string;
  name: string;
}

interface ActivityCode {
  id: string;
  code: string;
  mainActivity: string | null;
  subActivity: string | null;
  fullDescription: string;
  category: ActivityCategory;
}

export default function ActivityCodesMasterPage() {
  const [activityCodes, setActivityCodes] = useState<ActivityCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal states (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");
  const [selectedActivityCodeId, setSelectedActivityCodeId] = useState<string | null>(null);

  // Bulk Import modal states
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [bulkPreview, setBulkPreview] = useState<any[]>([]);
  const [bulkError, setBulkError] = useState("");
  const [bulkLoading, setBulkLoading] = useState(false);

  // Form states
  const [formCategoryCode, setFormCategoryCode] = useState("BR");
  const [formCode, setFormCode] = useState("");
  const [formMainActivity, setFormMainActivity] = useState("");
  const [formSubActivity, setFormSubActivity] = useState("");
  const [formFullDescription, setFormFullDescription] = useState("");

  // Category options (matches Prisma seeds)
  const categoryOptions = [
    { code: "PR", name: "Production (PR)" },
    { code: "SH", name: "Scheduled Shutdown (SH)" },
    { code: "BR", name: "Breakdown (BR)" },
    { code: "SE", name: "Setup / Changeover (SE)" },
    { code: "MI", name: "Minor Stoppages (MI)" },
    { code: "CT", name: "Change Tool (CT)" },
    { code: "OT", name: "Other Downtime (OT)" },
    { code: "ST", name: "Standby (ST)" },
  ];

  // Fetch activity codes from API
  const fetchActivityCodes = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/master/activity-codes");
      if (res.ok) {
        const data = await res.json();
        setActivityCodes(data.activityCodes);
      } else {
        const data = await res.json();
        setError(data.error || "Gagal memuat activity codes.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityCodes();
  }, []);

  // Filter activity codes based on search query
  const filteredActivityCodes = activityCodes.filter(
    (ac) =>
      ac.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (ac.mainActivity && ac.mainActivity.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (ac.subActivity && ac.subActivity.toLowerCase().includes(searchQuery.toLowerCase())) ||
      ac.fullDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ac.category.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open modal for adding
  const handleOpenAdd = () => {
    setModalMode("ADD");
    setSelectedActivityCodeId(null);
    setFormCategoryCode("BR");
    setFormCode("");
    setFormMainActivity("");
    setFormSubActivity("");
    setFormFullDescription("");
    setError("");
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (ac: ActivityCode) => {
    setModalMode("EDIT");
    setSelectedActivityCodeId(ac.id);
    setFormCategoryCode(ac.category.code);
    setFormCode(ac.code);
    setFormMainActivity(ac.mainActivity || "");
    setFormSubActivity(ac.subActivity || "");
    setFormFullDescription(ac.fullDescription);
    setError("");
    setIsModalOpen(true);
  };

  // Submit form (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!formCategoryCode || !formCode || !formFullDescription) {
      setError("Kategori, kode, dan deskripsi lengkap wajib diisi.");
      return;
    }

    const payload = {
      categoryCode: formCategoryCode,
      code: formCode,
      mainActivity: formMainActivity || null,
      subActivity: formSubActivity || null,
      fullDescription: formFullDescription,
    };

    try {
      let url = "/api/master/activity-codes";
      let method = "POST";

      if (modalMode === "EDIT" && selectedActivityCodeId) {
        url = `/api/master/activity-codes/${selectedActivityCodeId}`;
        method = "PUT";
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message || "Aksi berhasil.");
        setIsModalOpen(false);
        fetchActivityCodes(); // reload
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.error || "Gagal memproses data.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server.");
    }
  };

  // Delete activity code
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus Activity Code ini?")) return;
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/master/activity-codes/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message || "Activity Code berhasil dihapus.");
        fetchActivityCodes();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.error || "Gagal menghapus Activity Code.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server.");
    }
  };

  // CSV/Excel Client-side parsing engine supporting tab cell pasting
  const handleParseCsv = (text: string) => {
    setBulkError("");
    if (!text.trim()) {
      setBulkPreview([]);
      return;
    }

    const lines = text.split("\n");
    const parsedData: any[] = [];
    
    // Auto-detect header row
    const firstLine = lines[0].toLowerCase();
    const hasHeader =
      firstLine.includes("code") ||
      firstLine.includes("produksi") ||
      firstLine.includes("category") ||
      firstLine.includes("main");

    const startIndex = hasHeader ? 1 : 0;

    for (let i = startIndex; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Handle Tab delimited (pasted from Excel) vs Comma delimited (standard CSV)
      let columns: string[] = [];
      if (line.includes("\t")) {
        columns = line.split("\t");
      } else {
        columns = line.split(",");
      }

      columns = columns.map((col) => col.replace(/^["']|["']$/g, "").trim());

      if (columns.length < 2) continue; // skip invalid empty lines safely

      const rawCode = columns[0].toLowerCase().trim();
      if (!rawCode) continue;

      // 1. Auto-extract category code from the code prefix (e.g. "sh.5" -> "SH", "pr" -> "PR")
      let derivedCategoryCode = "BR";
      if (rawCode === "pr") {
        derivedCategoryCode = "PR";
      } else if (rawCode.startsWith("sh")) {
        derivedCategoryCode = "SH";
      } else if (rawCode.startsWith("br")) {
        derivedCategoryCode = "BR";
      } else if (rawCode.startsWith("se")) {
        derivedCategoryCode = "SE";
      } else if (rawCode.startsWith("mi")) {
        derivedCategoryCode = "MI";
      } else if (rawCode.startsWith("ct")) {
        derivedCategoryCode = "CT";
      } else if (rawCode.startsWith("ot")) {
        derivedCategoryCode = "OT";
      } else if (rawCode.startsWith("st")) {
        derivedCategoryCode = "ST";
      }

      // 2. Parse details according to spreadsheet layout
      let mainAct = "";
      let subAct = "";
      let fullDesc = "";

      if (columns.length >= 6) {
        mainAct = columns[2];
        subAct = columns[4];
        fullDesc = columns[5] || (subAct ? `${mainAct} - ${subAct}` : mainAct);
      } else if (columns.length >= 3) {
        mainAct = columns[1];
        subAct = columns[2] || "";
        fullDesc = columns[3] || (subAct ? `${mainAct} - ${subAct}` : mainAct);
      } else {
        mainAct = columns[1] || "";
        fullDesc = columns[1] || "";
      }

      parsedData.push({
        categoryCode: derivedCategoryCode,
        code: rawCode,
        mainActivity: mainAct || null,
        subActivity: subAct || null,
        fullDescription: fullDesc || mainAct,
      });
    }

    setBulkPreview(parsedData);
  };

  // CSV File Selector change handler
  const handleCsvFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvText(text);
      handleParseCsv(text);
    };
    reader.readAsText(file);
  };

  // Submit bulk payload to Server
  const handleBulkSubmit = async () => {
    if (bulkPreview.length === 0) {
      setBulkError("Tidak ada data valid yang siap di-import.");
      return;
    }

    setBulkLoading(true);
    setBulkError("");

    try {
      const res = await fetch("/api/master/activity-codes/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codes: bulkPreview }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message || "Bulk import berhasil diproses.");
        setIsBulkOpen(false);
        setCsvText("");
        setBulkPreview([]);
        fetchActivityCodes();
        setTimeout(() => setSuccessMsg(""), 4000);
      } else {
        setBulkError(data.error || "Gagal memproses bulk import.");
      }
    } catch (err) {
      console.error(err);
      setBulkError("Kesalahan koneksi ke server.");
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full bg-transparent text-[var(--text-primary)]">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border-color)] pb-5">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5 font-mono">
            <Hash className="w-5 h-5 text-[#5ebd56]" />
            Master Data: Activity & Downtime Codes
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">Manage plant activities, downtime reason codes, setup/changeovers, and breakdown codes.</p>
        </div>

        <div className="flex gap-2">
          {/* Bulk Import Button */}
          <button
            onClick={() => {
              setBulkError("");
              setBulkPreview([]);
              setCsvText("");
              setIsBulkOpen(true);
            }}
            className="flex items-center gap-2 px-3.5 py-2 bg-[var(--bg-card)] hover:bg-[var(--hover-bg)] text-[var(--text-primary)] border border-[var(--border-color)] font-bold rounded-lg text-xs transition-colors cursor-pointer uppercase font-mono tracking-wider shadow-[var(--card-shadow)]"
          >
            <Upload className="w-3.5 h-3.5 text-[#5ebd56]" />
            Import Excel / CSV
          </button>

          {/* Add New Button */}
          <button
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 bg-[#5ebd56] hover:bg-[#53a74c] text-black font-extrabold rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-[0_2px_8px_rgba(94,189,86,0.1)]"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Code
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 text-[#5ebd56] p-4 rounded-lg text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
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
            placeholder="Search codes by name, category, or description..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[#5ebd56] font-mono transition-all"
          />
        </div>
        <button
          onClick={fetchActivityCodes}
          className="p-2 bg-[var(--bg-input)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          title="Reload Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Activity Codes Data Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-[var(--card-shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--bg-sidebar)]/30 border-b border-[var(--border-color)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider font-mono">
                <th className="py-4 px-6 text-center w-16">No</th>
                <th className="py-4 px-6">Activity Code</th>
                <th className="py-4 px-6">OEE Category</th>
                <th className="py-4 px-6">Main Activity</th>
                <th className="py-4 px-6">Sub Activity</th>
                <th className="py-4 px-6">Full Description</th>
                <th className="py-4 px-6 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)] font-mono">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--text-secondary)] italic">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#5ebd56] mb-2" />
                    Fetching activity database...
                  </td>
                </tr>
              ) : filteredActivityCodes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[var(--text-secondary)] italic font-sans font-medium">
                    No activity codes found matching query.
                  </td>
                </tr>
              ) : (
                filteredActivityCodes.map((ac, idx) => (
                  <tr key={ac.id} className="hover:bg-[var(--hover-bg)]/20 transition-colors border-b border-[var(--border-color)]/40">
                    <td className="py-4 px-6 text-center text-[var(--text-secondary)] font-semibold">{idx + 1}</td>
                    <td className="py-4 px-6">
                      <span className="font-mono bg-[var(--bg-input)] px-2.5 py-1 rounded text-xs text-[#5ebd56] border border-[var(--border-color)] font-bold">
                        {ac.code.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="flex items-center gap-1.5 font-bold text-[var(--text-primary)]">
                        <Layers className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                        {ac.category.name}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[var(--text-primary)] font-sans font-semibold">{ac.mainActivity || "-"}</td>
                    <td className="py-4 px-6 text-[var(--text-secondary)] font-sans font-medium">{ac.subActivity || "-"}</td>
                    <td className="py-4 px-6 text-[var(--text-secondary)]/80 font-sans max-w-xs truncate" title={ac.fullDescription}>
                      {ac.fullDescription}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleOpenEdit(ac)}
                          className="p-1.5 bg-[var(--bg-input)] hover:bg-[#5ebd56]/10 border border-[var(--border-color)] hover:border-[#5ebd56]/30 text-[var(--text-secondary)] hover:text-[#5ebd56] rounded transition-colors cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(ac.id)}
                          className="p-1.5 bg-[var(--bg-input)] hover:bg-rose-500/10 border border-[var(--border-color)] hover:border-rose-500/30 text-[var(--text-secondary)] hover:text-rose-500 rounded transition-colors cursor-pointer"
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

      {/* BULK IMPORT MODAL DIALOG */}
      {isBulkOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl max-w-3xl w-full overflow-hidden shadow-2xl relative flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex justify-between items-center p-5 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/40">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-[#5ebd56]" />
                <h3 className="font-bold text-sm uppercase tracking-wider text-[var(--text-primary)] font-mono">
                  Bulk Import Activity Codes
                </h3>
              </div>
              <button
                onClick={() => setIsBulkOpen(false)}
                className="p-1.5 hover:bg-[var(--hover-bg)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs font-mono">
              {bulkError && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3.5 rounded-lg font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{bulkError}</span>
                </div>
              )}

              {/* Template instructions */}
              <div className="bg-[var(--bg-input)] border border-[var(--border-color)] p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-[10px]">Excel Copy-Paste Supported!</span>
                  <span className="bg-[#1a2e22] text-emerald-450 px-2 py-0.5 rounded text-[8px] font-bold uppercase border border-emerald-500/10">Idempotent Upsert</span>
                </div>
                <p className="text-[var(--text-secondary)] font-sans font-medium leading-relaxed">
                  You can copy cells from Excel or Google Sheets (containing code, category, main activity, sub activity, full description) and paste them directly in the text area below. Tabs and commas are auto-detected, and OEE categories are auto-extracted from the code prefix!
                </p>
                <div className="pt-2">
                  <span className="font-semibold text-[var(--text-secondary)]">Excel Column Layout:</span>
                  <div className="text-[9px] text-[#5ebd56] bg-[var(--bg-input)] border border-[var(--border-color)] p-2 rounded mt-1 overflow-x-auto select-all">
                    Code [Tab] Category Name [Tab] Main Activity [Tab] - [Tab] Sub Activity [Tab] Full Description
                  </div>
                </div>
              </div>

              {/* Direct CSV text or file selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* Drag / File selector */}
                <div className="flex flex-col gap-2">
                  <span className="font-bold text-[var(--text-secondary)] uppercase tracking-wider text-[10px]">Option A: Upload CSV File</span>
                  <label className="border-2 border-dashed border-[var(--border-color)] hover:border-[#5ebd56] rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors bg-[var(--bg-input)]/50 h-36">
                    <Upload className="w-6 h-6 text-zinc-500" />
                    <span className="font-bold text-[var(--text-primary)] font-sans">Choose CSV File</span>
                    <span className="text-[10px] text-[var(--text-secondary)] font-sans">Select a local .csv file</span>
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCsvFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Direct Paste Area */}
                <div className="flex flex-col gap-2">
                  <span className="font-bold text-[var(--text-secondary)] uppercase tracking-wider text-[10px]">Option B: Copy-Paste Excel Cells Directly</span>
                  <textarea
                    placeholder="Select cells from Excel, Copy, and Paste them here..."
                    value={csvText}
                    onChange={(e) => {
                      setCsvText(e.target.value);
                      handleParseCsv(e.target.value);
                    }}
                    rows={6}
                    className="w-full p-3 bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[#5ebd56] rounded-lg text-[10px] text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:outline-none resize-none h-36"
                  />
                </div>

              </div>

              {/* Parsed Live Preview Table */}
              {bulkPreview.length > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-[var(--text-primary)] uppercase tracking-wider text-[10px]">
                      Live Data Preview ({bulkPreview.length} items detected)
                    </span>
                    <span className="text-[9px] text-[#5ebd56] font-semibold">Parsed successfully!</span>
                  </div>

                  <div className="border border-[var(--border-color)] rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                    <table className="w-full text-left border-collapse text-[10px]">
                      <thead>
                        <tr className="bg-[var(--bg-input)] text-[var(--text-secondary)] font-bold uppercase tracking-wider border-b border-[var(--border-color)]">
                          <th className="py-2 px-3 w-14">Category</th>
                          <th className="py-2 px-3 w-20">Code</th>
                          <th className="py-2 px-3">Main Activity</th>
                          <th className="py-2 px-3">Sub Activity</th>
                          <th className="py-2 px-3">Description</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)] bg-[var(--bg-input)]/30">
                        {bulkPreview.map((row, idx) => (
                          <tr key={idx} className="hover:bg-[var(--hover-bg)]/20 transition-all">
                            <td className="py-1.5 px-3 font-bold text-[#5ebd56]">{row.categoryCode}</td>
                            <td className="py-1.5 px-3 text-[var(--text-primary)]">{row.code}</td>
                            <td className="py-1.5 px-3 truncate max-w-[120px] text-[var(--text-primary)]" title={row.mainActivity}>{row.mainActivity || "-"}</td>
                            <td className="py-1.5 px-3 truncate max-w-[120px] text-[var(--text-secondary)]" title={row.subActivity}>{row.subActivity || "-"}</td>
                            <td className="py-1.5 px-3 text-[var(--text-secondary)]/80 truncate max-w-[200px]" title={row.fullDescription}>{row.fullDescription}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 p-5 border-t border-[var(--border-color)] bg-[var(--bg-sidebar)]/40">
              <button
                type="button"
                onClick={() => setIsBulkOpen(false)}
                className="px-4 py-2 bg-[var(--bg-input)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold rounded-lg text-xs transition-colors cursor-pointer uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBulkSubmit}
                disabled={bulkLoading || bulkPreview.length === 0}
                className="px-5 py-2 bg-[#5ebd56] hover:bg-[#53a74c] text-black font-extrabold rounded-lg text-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider flex items-center gap-1.5 shadow-[0_2px_8px_rgba(94,189,86,0.1)]"
              >
                {bulkLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-3.5 h-3.5" />
                    <span>Confirm Bulk Import</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ADD/EDIT DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl max-w-lg w-full overflow-hidden shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/40">
              <h3 className="font-bold text-sm uppercase tracking-wider text-[var(--text-primary)] font-mono">
                {modalMode === "ADD" ? "Add New Activity Code" : "Edit Activity Code"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-[var(--hover-bg)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 font-mono">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-500 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* OEE Category Select */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">OEE Loss Category *</label>
                <select
                  value={formCategoryCode}
                  onChange={(e) => setFormCategoryCode(e.target.value)}
                  className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] focus:outline-none focus:border-[#5ebd56] font-sans cursor-pointer"
                >
                  {categoryOptions.map((opt) => (
                    <option key={opt.code} value={opt.code} className="bg-[var(--bg-card)] text-[var(--text-primary)]">
                      {opt.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Activity Code input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Activity Code *</label>
                <input
                  type="text"
                  placeholder="e.g., BR.1 or SH.2"
                  value={formCode}
                  onChange={(e) => setFormCode(e.target.value)}
                  required
                  className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:outline-none focus:border-[#5ebd56] font-sans"
                />
              </div>

              {/* Main Activity */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Main Activity Name</label>
                <input
                  type="text"
                  placeholder="e.g., Breakdown Mechanical"
                  value={formMainActivity}
                  onChange={(e) => setFormMainActivity(e.target.value)}
                  className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:outline-none focus:border-[#5ebd56] font-sans"
                />
              </div>

              {/* Sub Activity */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Sub Activity Name</label>
                <input
                  type="text"
                  placeholder="e.g., Chain Sprocket Slipping"
                  value={formSubActivity}
                  onChange={(e) => setFormSubActivity(e.target.value)}
                  className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:outline-none focus:border-[#5ebd56] font-sans"
                />
              </div>

              {/* Full Description */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Full Audit Description *</label>
                <textarea
                  placeholder="e.g., Breakdown Mechanical - Chain Sprocket Slipping"
                  value={formFullDescription}
                  onChange={(e) => setFormFullDescription(e.target.value)}
                  required
                  rows={3}
                  className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:outline-none focus:border-[#5ebd56] font-sans resize-none"
                />
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 border-t border-[var(--border-color)] pt-5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[var(--bg-input)] hover:bg-[var(--hover-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-semibold rounded-lg text-xs transition-all cursor-pointer font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5ebd56] hover:bg-[#53a74c] text-black font-bold rounded-lg text-xs transition-all cursor-pointer font-mono shadow-[0_2px_8px_rgba(94,189,86,0.1)]"
                >
                  {modalMode === "ADD" ? "Add Activity Code" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
