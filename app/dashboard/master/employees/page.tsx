"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, X, RefreshCw, AlertCircle, Users, Mail, Key } from "lucide-react";

interface Employee {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function EmployeesMasterPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);

  // Form states
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState("OPERATOR");

  // Fetch employees from API
  const fetchEmployees = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/master/employees");
      if (res.ok) {
        const data = await res.json();
        setEmployees(data.employees);
      } else {
        const data = await res.json();
        setError(data.error || "Gagal memuat daftar karyawan.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // Filter employees based on search query
  const filteredEmployees = employees.filter(
    (e) =>
      e.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Open modal for adding
  const handleOpenAdd = () => {
    setModalMode("ADD");
    setSelectedEmployeeId(null);
    setFormEmail("");
    setFormPassword("");
    setFormRole("OPERATOR");
    setError("");
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (e: Employee) => {
    setModalMode("EDIT");
    setSelectedEmployeeId(e.id);
    setFormEmail(e.email);
    setFormPassword(""); // Leave blank by default for no password change
    setFormRole(e.role);
    setError("");
    setIsModalOpen(true);
  };

  // Submit form (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!formEmail || !formRole || (modalMode === "ADD" && !formPassword)) {
      setError("Email, role, dan password (untuk karyawan baru) wajib diisi.");
      return;
    }

    const payload: any = {
      email: formEmail,
      role: formRole,
    };

    if (formPassword) {
      payload.password = formPassword;
    }

    try {
      let url = "/api/master/employees";
      let method = "POST";

      if (modalMode === "EDIT" && selectedEmployeeId) {
        url = `/api/master/employees/${selectedEmployeeId}`;
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
        fetchEmployees(); // reload
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.error || "Gagal memproses data.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server.");
    }
  };

  // Delete employee
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus karyawan ini?")) return;
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/master/employees/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message || "Karyawan berhasil dihapus.");
        fetchEmployees();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.error || "Gagal menghapus karyawan.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server.");
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full bg-[#141318] text-[#f4f3f6]">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#26232b] pb-5">
        <div>
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight flex items-center gap-2.5 font-mono">
            <Users className="w-5 h-5 text-[#5ebd56]" />
            Master Data: Employees Directory
          </h2>
          <p className="text-xs text-[#8e8b94] mt-1 font-mono">Mengelola daftar staf, operator mesin, dan akun manajer di pabrik Anda.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#5ebd56] hover:bg-[#53a74c] text-black font-extrabold rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-[0_2px_8px_rgba(94,189,86,0.1)]"
        >
          <Plus className="w-3.5 h-3.5" />
          Add New Employee
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
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-450 p-4 rounded-lg text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Search & Actions Utility */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-[#1c1a21] border border-[#26232b] p-4 rounded-xl">
        <div className="relative w-full sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[#8e8b94]" />
          <input
            type="text"
            placeholder="Search employees by email or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[#121114] border border-[#26232b] rounded-lg text-xs text-zinc-100 placeholder-zinc-650 focus:outline-none focus:border-[#5ebd56] font-mono"
          />
        </div>
        <button
          onClick={fetchEmployees}
          className="p-2 bg-[#121114] hover:bg-zinc-800 border border-[#26232b] rounded-lg text-[#8e8b94] hover:text-zinc-200 transition-all cursor-pointer"
          title="Reload Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Employees Data Table */}
      <div className="bg-[#1c1a21] border border-[#26232b] rounded-xl overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[#1c1a21] border-b border-[#26232b] text-[#8e8b94] font-semibold uppercase tracking-wider font-mono">
                <th className="py-4 px-6 text-center w-16">No</th>
                <th className="py-4 px-6">Employee Email</th>
                <th className="py-4 px-6">Access Role</th>
                <th className="py-4 px-6">Date Joined</th>
                <th className="py-4 px-6 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#26232b] text-zinc-300 font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#8e8b94] italic">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#5ebd56] mb-2" />
                    Memuat data karyawan...
                  </td>
                </tr>
              ) : filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#8e8b94] italic font-sans font-medium">
                    Tidak ada data karyawan ditemukan.
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((emp, idx) => (
                  <tr key={emp.id} className="hover:bg-[#232029]/20 transition-all">
                    <td className="py-4 px-6 text-center text-[#8e8b94] font-semibold">{idx + 1}</td>
                    <td className="py-4 px-6 font-semibold text-zinc-100 font-sans">{emp.email}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-semibold tracking-wide border font-sans ${
                          emp.role === "OWNER"
                            ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                            : emp.role === "MANAGER"
                            ? "bg-violet-500/10 text-violet-400 border-violet-500/20"
                            : "bg-[#5ebd56]/10 text-[#5ebd56] border-[#5ebd56]/20"
                        }`}
                      >
                        {emp.role}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-[#8e8b94]">
                      {new Date(emp.createdAt).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleOpenEdit(emp)}
                          className="p-1.5 bg-[#121114] hover:bg-[#5ebd56]/10 border border-[#26232b] hover:border-[#5ebd56]/30 text-[#8e8b94] hover:text-[#5ebd56] rounded transition-all cursor-pointer"
                          title="Edit / Reset Password"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(emp.id)}
                          className="p-1.5 bg-[#121114] hover:bg-rose-500/10 border border-[#26232b] hover:border-rose-500/30 text-[#8e8b94] hover:text-rose-400 rounded transition-all cursor-pointer"
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

      {/* MODAL ADD/EDIT DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#1c1a21] border border-[#26232b] rounded-xl max-w-md w-full overflow-hidden shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-[#26232b] bg-[#141318]">
              <h3 className="font-bold text-sm text-zinc-100 font-mono uppercase tracking-wider">
                {modalMode === "ADD" ? "Add New Employee" : "Edit Employee Profile"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-zinc-300 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4 font-mono">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-450 p-3 rounded-lg text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#8e8b94] uppercase tracking-wide">Email Address *</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-655 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="email"
                    placeholder="operator@company.com"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    required
                    disabled={modalMode === "EDIT"}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#121114] border border-[#26232b] rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-[#5ebd56] font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#8e8b94] uppercase tracking-wide">
                  {modalMode === "ADD" ? "Password *" : "Ganti Password (Kosongkan jika tidak diganti)"}
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-zinc-655 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder={modalMode === "ADD" ? "Minimum 6 karakter" : "••••••••"}
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    required={modalMode === "ADD"}
                    className="w-full pl-9 pr-3.5 py-2.5 bg-[#121114] border border-[#26232b] rounded-lg text-sm text-zinc-100 placeholder-zinc-700 focus:outline-none focus:border-[#5ebd56] font-sans"
                  />
                </div>
              </div>

              {/* Role */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[#8e8b94] uppercase tracking-wide">Access Role *</label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="px-3.5 py-2.5 bg-[#121114] border border-[#26232b] rounded-lg text-sm text-zinc-100 focus:outline-none focus:border-[#5ebd56] font-sans cursor-pointer"
                >
                  <option value="OWNER">Owner</option>
                  <option value="MANAGER">Manager</option>
                  <option value="OPERATOR">Operator</option>
                </select>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end gap-3 border-t border-[#26232b] pt-5 mt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-750 text-zinc-300 font-semibold rounded-lg text-xs transition-all cursor-pointer font-mono"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#5ebd56] hover:bg-[#53a74c] text-black font-bold rounded-lg text-xs transition-all cursor-pointer font-mono"
                >
                  {modalMode === "ADD" ? "Register Employee" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
