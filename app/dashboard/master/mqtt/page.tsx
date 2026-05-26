"use client";

import React, { useState, useEffect } from "react";
import { 
  Wifi, 
  Cpu, 
  Settings, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  AlertTriangle, 
  Loader2, 
  ArrowRight,
  Info,
  ExternalLink
} from "lucide-react";

export default function MqttConfigPage() {
  const [machines, setMachines] = useState<any[]>([]);
  const [mqttConfigs, setMqttConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Form State
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [machineId, setMachineId] = useState("");
  const [brokerUrl, setBrokerUrl] = useState("mqtt://127.0.0.1:1883");
  const [clientId, setClientId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [counterTopic, setCounterTopic] = useState("");
  const [counterJsonPath, setCounterJsonPath] = useState("");
  const [statusTopic, setStatusTopic] = useState("");
  const [statusJsonPath, setStatusJsonPath] = useState("");
  const [statusRunValue, setStatusRunValue] = useState("RUN");
  const [statusStopValue, setStatusStopValue] = useState("STOP");

  // Fetch data
  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Machines
      const resMachines = await fetch("/api/master/machines");
      const dataMachines = await resMachines.json();
      setMachines(dataMachines.machines || []);

      // 2. Fetch MQTT Configs
      const resConfigs = await fetch("/api/master/mqtt-configs");
      const dataConfigs = await resConfigs.json();
      setMqttConfigs(dataConfigs.mqttConfigs || []);
    } catch (err) {
      console.error(err);
      setError("Gagal mengambil data dari server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleEdit = (config: any) => {
    setEditingId(config.id);
    setMachineId(config.machineId.toString());
    setBrokerUrl(config.brokerUrl);
    setClientId(config.clientId || "");
    setUsername(config.username || "");
    setPassword(config.password || "");
    setCounterTopic(config.counterTopic || "");
    setCounterJsonPath(config.counterJsonPath || "");
    setStatusTopic(config.statusTopic || "");
    setStatusJsonPath(config.statusJsonPath || "");
    setStatusRunValue(config.statusRunValue || "RUN");
    setStatusStopValue(config.statusStopValue || "STOP");
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Apakah Anda yakin ingin menghapus integrasi MQTT untuk mesin ini?")) return;

    try {
      const res = await fetch(`/api/master/mqtt-configs/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSuccess("Konfigurasi MQTT berhasil dihapus.");
        fetchData();
      } else {
        const errData = await res.json();
        setError(errData.error || "Gagal menghapus konfigurasi.");
      }
    } catch (err) {
      setError("Koneksi gagal.");
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess("");

    const payload = {
      machineId,
      brokerUrl,
      clientId: clientId || null,
      username: username || null,
      password: password || null,
      counterTopic: counterTopic || null,
      counterJsonPath: counterJsonPath || null,
      statusTopic: statusTopic || null,
      statusJsonPath: statusJsonPath || null,
      statusRunValue,
      statusStopValue,
    };

    try {
      const res = await fetch("/api/master/mqtt-configs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSuccess(editingId ? "Konfigurasi MQTT berhasil diperbarui!" : "Konfigurasi MQTT baru berhasil didaftarkan!");
        resetForm();
        fetchData();
      } else {
        const errData = await res.json();
        setError(errData.error || "Gagal menyimpan konfigurasi.");
      }
    } catch (err) {
      setError("Terjadi kesalahan jaringan.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setMachineId("");
    setBrokerUrl("mqtt://127.0.0.1:1883");
    setClientId("");
    setUsername("");
    setPassword("");
    setCounterTopic("");
    setCounterJsonPath("");
    setStatusTopic("");
    setStatusJsonPath("");
    setStatusRunValue("RUN");
    setStatusStopValue("STOP");
    setShowForm(false);
  };

  // Find unused machines
  const configuredMachineIds = mqttConfigs.map((c) => c.machineId);
  const availableMachines = machines.filter(
    (m) => !configuredMachineIds.includes(m.id) || (editingId && m.id === parseInt(machineId, 10))
  );

  return (
    <div className="p-6 max-w-7xl mx-auto flex flex-col gap-6 select-none">
      
      {/* HEADER SECTION */}
      <div className="flex items-center justify-between border-b border-[#26232b] pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <Wifi className="w-5 h-5 text-[#5ebd56]" />
            MQTT Sensor Telemetry Acquisition
          </h1>
          <p className="text-xs text-[#8e8b94] mt-1">
            Konfigurasikan integrasi sensor IOT MQTT (Photoeye Counter, Status Relay) secara fleksibel per mesin produksi.
          </p>
        </div>

        <button
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
          className="bg-[#5ebd56] hover:bg-[#5ebd56]/90 active:bg-[#5ebd56]/80 text-[#141318] text-xs font-bold px-4 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer font-mono"
        >
          {showForm ? "Batal" : <><Plus className="w-4 h-4" /> Tambah Sensor MQTT</>}
        </button>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {success && (
        <div className="bg-[#5ebd56]/10 border border-[#5ebd56]/30 px-4 py-3 rounded-lg flex items-center gap-2 text-[#5ebd56] text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4" />
          {success}
        </div>
      )}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 px-4 py-3 rounded-lg flex items-center gap-2 text-rose-400 text-xs font-semibold">
          <AlertTriangle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* MQTT CONFIGURATION FORM (DYNAMIC ACQUISITION CREATION) */}
      {showForm && (
        <form onSubmit={handleFormSubmit} className="bg-[#1c1a21] border border-[#26232b] rounded-xl p-5 flex flex-col gap-5 shadow-lg">
          <div className="flex items-center gap-2 border-b border-[#26232b]/60 pb-3">
            <Settings className="w-4 h-4 text-[#5ebd56]" />
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-200">
              {editingId ? "Edit Integrasi Telemetry" : "Konfigurasi Akuisisi Sensor Baru"}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* 1. Target Machine Selection */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8e8b94]">Mesin Produksi</label>
              <select
                required
                value={machineId}
                disabled={editingId !== null}
                onChange={(e) => setMachineId(e.target.value)}
                className="bg-[#232029] border border-[#26232b] text-zinc-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5ebd56]/50 cursor-pointer"
              >
                <option value="">-- Pilih Mesin --</option>
                {availableMachines.map((m) => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            {/* 2. MQTT Broker URL */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8e8b94]">Broker URL</label>
              <input
                type="text"
                required
                placeholder="mqtt://127.0.0.1:1883"
                value={brokerUrl}
                onChange={(e) => setBrokerUrl(e.target.value)}
                className="bg-[#232029] border border-[#26232b] text-zinc-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5ebd56]/50 font-mono"
              />
            </div>

            {/* 3. Custom Client ID */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8e8b94]">Client ID (Optional)</label>
              <input
                type="text"
                placeholder="kmi_oee_lineA4"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                className="bg-[#232029] border border-[#26232b] text-zinc-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5ebd56]/50 font-mono"
              />
            </div>

            {/* 4. MQTT Broker Username */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8e8b94]">Username Broker</label>
              <input
                type="text"
                placeholder="Kosongkan jika publik"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-[#232029] border border-[#26232b] text-zinc-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5ebd56]/50 font-mono"
              />
            </div>

            {/* 5. MQTT Broker Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-wider text-[#8e8b94]">Password Broker</label>
              <input
                type="password"
                placeholder="Kosongkan jika publik"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-[#232029] border border-[#26232b] text-zinc-100 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5ebd56]/50 font-mono"
              />
            </div>

          </div>

          {/* TELEMETRY SENSOR SEGMENTATIONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-2">
            
            {/* LEFT: SENSOR COUNTER FG (Photoeye / Proximity) */}
            <div className="bg-[#232029]/60 border border-[#26232b] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-1.5 border-b border-[#26232b]/80 pb-2">
                <Cpu className="w-3.5 h-3.5 text-[#5ebd56]" />
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-[#5ebd56]">
                  1. Sensor Output FG Counter (Proximity)
                </h3>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#8e8b94]">MQTT Counter Topic</label>
                  <input
                    type="text"
                    placeholder="kmi/lineA4/counter"
                    value={counterTopic}
                    onChange={(e) => setCounterTopic(e.target.value)}
                    className="bg-[#1c1a21] border border-[#26232b] text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5ebd56]/30 font-mono"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#8e8b94] flex items-center gap-1">
                    JSON Path (Optional)
                    <span className="group relative cursor-pointer text-[#5ebd56]"><Info className="w-3 h-3"/>
                      <span className="absolute hidden group-hover:block bg-[#1c1a21] border border-[#26232b] p-2 rounded text-[8px] text-zinc-300 w-44 z-50 mt-1">
                        Gunakan $.qty jika payload bernilai {"{\"qty\": 5}"}. Kosongkan jika mengirim angka murni.
                      </span>
                    </span>
                  </label>
                  <input
                    type="text"
                    placeholder="$.value"
                    value={counterJsonPath}
                    onChange={(e) => setCounterJsonPath(e.target.value)}
                    className="bg-[#1c1a21] border border-[#26232b] text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5ebd56]/30 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* RIGHT: SENSOR STATUS MESIN (Relay / PLC State) */}
            <div className="bg-[#232029]/60 border border-[#26232b] rounded-xl p-4 flex flex-col gap-3">
              <div className="flex items-center gap-1.5 border-b border-[#26232b]/80 pb-2">
                <Wifi className="w-3.5 h-3.5 text-sky-400" />
                <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-sky-400">
                  2. Sensor Status Jalur Mesin (Relay/PLC)
                </h3>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-wider text-[#8e8b94]">MQTT Status Topic</label>
                  <input
                    type="text"
                    placeholder="kmi/lineA4/status"
                    value={statusTopic}
                    onChange={(e) => setStatusTopic(e.target.value)}
                    className="bg-[#1c1a21] border border-[#26232b] text-zinc-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#5ebd56]/30 font-mono"
                  />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="flex flex-col gap-1 col-span-1">
                    <label className="text-[8px] font-bold uppercase tracking-wider text-[#8e8b94]">JSON Path</label>
                    <input
                      type="text"
                      placeholder="$.state"
                      value={statusJsonPath}
                      onChange={(e) => setStatusJsonPath(e.target.value)}
                      className="bg-[#1c1a21] border border-[#26232b] text-zinc-200 rounded-lg px-2 py-2 text-[10px] focus:outline-none focus:border-[#5ebd56]/30 font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1 col-span-1">
                    <label className="text-[8px] font-bold uppercase tracking-wider text-[#8e8b94]">Value RUN</label>
                    <input
                      type="text"
                      required
                      placeholder="RUN"
                      value={statusRunValue}
                      onChange={(e) => setStatusRunValue(e.target.value)}
                      className="bg-[#1c1a21] border border-[#26232b] text-zinc-200 rounded-lg px-2 py-2 text-[10px] focus:outline-none focus:border-[#5ebd56]/30 font-mono"
                    />
                  </div>
                  <div className="flex flex-col gap-1 col-span-1">
                    <label className="text-[8px] font-bold uppercase tracking-wider text-[#8e8b94]">Value STOP</label>
                    <input
                      type="text"
                      required
                      placeholder="STOP"
                      value={statusStopValue}
                      onChange={(e) => setStatusStopValue(e.target.value)}
                      className="bg-[#1c1a21] border border-[#26232b] text-zinc-200 rounded-lg px-2 py-2 text-[10px] focus:outline-none focus:border-[#5ebd56]/30 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* FORM FOOTER ACTIONS */}
          <div className="flex items-center justify-end gap-3 mt-2 border-t border-[#26232b] pt-4">
            <button
              type="button"
              onClick={resetForm}
              className="bg-[#232029] hover:bg-[#232029]/70 border border-[#26232b] text-zinc-300 text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              Batalkan
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#5ebd56] hover:bg-[#5ebd56]/90 active:bg-[#5ebd56]/80 text-[#141318] text-xs font-bold px-5 py-2 rounded-lg flex items-center gap-1.5 transition-all shadow-md cursor-pointer font-mono"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...</>
              ) : (
                "Simpan Konfigurasi"
              )}
            </button>
          </div>
        </form>
      )}

      {/* ACTIVE INTEGRATIONS TABLE */}
      <div className="bg-[#1c1a21] border border-[#26232b] rounded-xl overflow-hidden shadow-lg">
        <div className="px-5 py-4 border-b border-[#26232b] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-[#5ebd56]" />
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-zinc-200">
              Daftar Integrasi MQTT Aktif per Mesin
            </h2>
          </div>
          <span className="text-[10px] bg-[#232029] text-zinc-400 px-2.5 py-1 rounded-full font-mono">
            {mqttConfigs.length} Mesin Terintegrasi
          </span>
        </div>

        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2">
            <Loader2 className="w-8 h-8 text-[#5ebd56] animate-spin" />
            <span className="text-xs text-[#8e8b94] font-mono">Memuat konfigurasi sensor MQTT...</span>
          </div>
        ) : mqttConfigs.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center gap-3 text-center px-4">
            <Wifi className="w-12 h-12 text-[#26232b] animate-pulse" />
            <div>
              <p className="text-xs font-bold text-zinc-300">Belum ada integrasi sensor MQTT</p>
              <p className="text-[10px] text-[#8e8b94] max-w-sm mt-1 mx-auto">
                Daftarkan sensor digital PLC atau Proximity pabrik Anda ke topik broker MQTT agar Next.js dapat merekam OEE secara otomatis.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#141318]/50 border-b border-[#26232b] text-[#8e8b94] text-[9px] font-bold uppercase tracking-wider">
                  <th className="px-5 py-3">Nama Mesin</th>
                  <th className="px-5 py-3">Broker & Client ID</th>
                  <th className="px-5 py-3">Counter FG Sensor Topic</th>
                  <th className="px-5 py-3">Status Sensor Topic</th>
                  <th className="px-5 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26232b]/60">
                {mqttConfigs.map((config) => (
                  <tr key={config.id} className="hover:bg-[#232029]/15 transition-colors text-xs text-zinc-300">
                    <td className="px-5 py-4 font-bold text-zinc-200">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-[#5ebd56] shadow-[0_0_8px_#5ebd56]" />
                        {config.machine?.name}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1">
                        <span className="font-mono text-[10px] text-zinc-200">{config.brokerUrl}</span>
                        {config.clientId && (
                          <span className="text-[9px] text-[#8e8b94] font-mono">CID: {config.clientId}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      {config.counterTopic ? (
                        <div className="flex flex-col gap-1 font-mono text-[10px] text-[#5ebd56]">
                          <span>{config.counterTopic}</span>
                          {config.counterJsonPath && (
                            <span className="text-[9px] text-[#8e8b94]">Path: {config.counterJsonPath}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[#8e8b94] text-[10px]">Tidak diatur</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {config.statusTopic ? (
                        <div className="flex flex-col gap-1 font-mono text-[10px] text-sky-400">
                          <span>{config.statusTopic}</span>
                          <span className="text-[8px] text-[#8e8b94] flex items-center gap-1">
                            RUN: <strong className="text-emerald-400">{config.statusRunValue}</strong> | 
                            STOP: <strong className="text-rose-400">{config.statusStopValue}</strong>
                          </span>
                        </div>
                      ) : (
                        <span className="text-[#8e8b94] text-[10px]">Tidak diatur</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(config)}
                          className="p-1.5 bg-[#232029] hover:bg-[#232029]/80 border border-[#26232b] text-zinc-300 rounded-lg transition-colors cursor-pointer"
                          title="Edit Konfigurasi"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(config.id)}
                          className="p-1.5 bg-rose-500/5 hover:bg-rose-500/10 border border-rose-500/10 text-rose-400 rounded-lg transition-colors cursor-pointer"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
