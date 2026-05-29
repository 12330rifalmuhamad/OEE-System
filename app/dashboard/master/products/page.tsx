"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Edit2, Trash2, X, RefreshCw, AlertCircle, Package } from "lucide-react";

interface Product {
  id: string;
  productCode: string | null;
  name: string;
  size: string | null;
  standarSpeed: number;
}

export default function ProductsMasterPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Form states
  const [formProductCode, setFormProductCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formSize, setFormSize] = useState("");
  const [formSpeed, setFormSpeed] = useState("");

  // Fetch products from API
  const fetchProducts = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/master/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products);
      } else {
        const data = await res.json();
        setError(data.error || "Gagal memuat produk.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products based on search query
  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.productCode && p.productCode.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Open modal for adding
  const handleOpenAdd = () => {
    setModalMode("ADD");
    setSelectedProductId(null);
    setFormProductCode("");
    setFormName("");
    setFormSize("");
    setFormSpeed("");
    setError("");
    setIsModalOpen(true);
  };

  // Open modal for editing
  const handleOpenEdit = (p: Product) => {
    setModalMode("EDIT");
    setSelectedProductId(p.id);
    setFormProductCode(p.productCode || "");
    setFormName(p.name);
    setFormSize(p.size || "");
    setFormSpeed(p.standarSpeed.toString());
    setError("");
    setIsModalOpen(true);
  };

  // Submit form (Add or Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    if (!formName || !formSpeed) {
      setError("Nama produk dan standar speed wajib diisi.");
      return;
    }

    const payload = {
      productCode: formProductCode,
      name: formName,
      size: formSize,
      standarSpeed: Number(formSpeed),
    };

    try {
      let url = "/api/master/products";
      let method = "POST";

      if (modalMode === "EDIT" && selectedProductId) {
        url = `/api/master/products/${selectedProductId}`;
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
        fetchProducts(); // reload
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.error || "Gagal memproses data.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server.");
    }
  };

  // Delete product
  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/master/products/${id}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessMsg(data.message || "Produk berhasil dihapus.");
        fetchProducts();
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.error || "Gagal menghapus produk.");
      }
    } catch (err) {
      console.error(err);
      setError("Kesalahan koneksi ke server.");
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 flex flex-col gap-6 max-w-7xl mx-auto w-full bg-transparent text-[var(--text-primary)]">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[var(--border-color)] pb-5">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight flex items-center gap-2.5 font-mono">
            <Package className="w-5 h-5 text-[#5ebd56]" />
            Master Data: Products Directory
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">Mengelola katalog produk aktif dan kecepatan standar cycle time (standar speed).</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#5ebd56] hover:bg-[#53a74c] text-black font-extrabold rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer shadow-[0_2px_8px_rgba(94,189,86,0.1)]"
        >
          <Plus className="w-3.5 h-3.5" />
          Add New Product
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
            placeholder="Search products by code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-xs text-[var(--text-primary)] placeholder-[var(--text-secondary)]/50 focus:outline-none focus:border-[#5ebd56] font-mono transition-all"
          />
        </div>
        <button
          onClick={fetchProducts}
          className="p-2 bg-[var(--bg-input)] hover:bg-[var(--hover-bg)] border border-[var(--border-color)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          title="Reload Data"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Products Data Table */}
      <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl overflow-hidden shadow-[var(--card-shadow)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-[var(--bg-sidebar)]/30 border-b border-[var(--border-color)] text-[var(--text-secondary)] font-semibold uppercase tracking-wider font-mono">
                <th className="py-4 px-6 text-center w-16">No</th>
                <th className="py-4 px-6">Product Code</th>
                <th className="py-4 px-6">Product Name</th>
                <th className="py-4 px-6">Size / Pack</th>
                <th className="py-4 px-6 text-right">Standard Speed</th>
                <th className="py-4 px-6 text-center w-28">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-color)] text-[var(--text-primary)] font-mono">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-secondary)] italic">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#5ebd56] mb-2" />
                    Memuat data katalog produk...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[var(--text-secondary)] italic font-sans font-medium">
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, idx) => (
                  <tr key={p.id} className="hover:bg-[var(--hover-bg)]/20 transition-all border-b border-[var(--border-color)]/40">
                    <td className="py-4 px-6 text-center text-[var(--text-secondary)] font-semibold">{idx + 1}</td>
                    <td className="py-4 px-6">
                      <span className="font-mono bg-[var(--bg-input)] px-2.5 py-1 rounded text-xs text-[#5ebd56] border border-[var(--border-color)] font-bold">
                        {p.productCode || "N/A"}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-semibold text-[var(--text-primary)] font-sans">{p.name}</td>
                    <td className="py-4 px-6 text-[var(--text-secondary)] font-sans">{p.size || "-"}</td>
                    <td className="py-4 px-6 text-right font-extrabold text-[var(--text-primary)]">{p.standarSpeed} cpm / kg</td>
                    <td className="py-4 px-6 text-center">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 bg-[var(--bg-input)] hover:bg-[#5ebd56]/10 border border-[var(--border-color)] hover:border-[#5ebd56]/30 text-[var(--text-secondary)] hover:text-[#5ebd56] rounded transition-all cursor-pointer"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
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

      {/* MODAL ADD/EDIT DIALOG */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl max-w-md w-full overflow-hidden shadow-2xl relative">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-5 border-b border-[var(--border-color)] bg-[var(--bg-sidebar)]/40">
              <h3 className="font-bold text-sm text-[var(--text-primary)] font-mono uppercase tracking-wider">
                {modalMode === "ADD" ? "Add New Product" : "Edit Product Profile"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 hover:bg-[var(--hover-bg)] rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
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

              {/* Product Code */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Kode Produk</label>
                <input
                  type="text"
                  placeholder="e.g., KMI-001"
                  value={formProductCode}
                  onChange={(e) => setFormProductCode(e.target.value)}
                  className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:outline-none focus:border-[#5ebd56] font-sans"
                />
              </div>

              {/* Product Name */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Nama Produk *</label>
                <input
                  type="text"
                  placeholder="e.g., Kalpanax Liquid"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  required
                  className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:outline-none focus:border-[#5ebd56] font-sans"
                />
              </div>

              {/* Size / Pack */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Ukuran / Kemasan</label>
                <input
                  type="text"
                  placeholder="e.g., 10 ml or 12x10ml"
                  value={formSize}
                  onChange={(e) => setFormSize(e.target.value)}
                  className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:outline-none focus:border-[#5ebd56] font-sans"
                />
              </div>

              {/* Standard Speed */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wide">Standard Speed (cpm / kg) *</label>
                <input
                  type="number"
                  placeholder="e.g., 120"
                  value={formSpeed}
                  onChange={(e) => setFormSpeed(e.target.value)}
                  required
                  className="px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] rounded-lg text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)]/40 focus:outline-none focus:border-[#5ebd56] font-sans"
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
                  className="px-5 py-2 bg-[#5ebd56] hover:bg-[#53a74c] text-black font-bold rounded-lg text-xs transition-all cursor-pointer font-mono"
                >
                  {modalMode === "ADD" ? "Add Product" : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
