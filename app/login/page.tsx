"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Login gagal.");
      }

      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Gagal masuk. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen w-screen bg-[#121114] text-[#f4f3f6] flex items-center justify-center p-4 md:p-8 font-sans relative overflow-hidden">

      {/* 1. Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#5ebd56]/5 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#7c4dff]/4 rounded-full blur-[140px] pointer-events-none z-0" />

      {/* Clean Custom CSS Overrides */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Precision Autofill Override */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 100px #121114 inset !important;
          -webkit-text-fill-color: #f4f3f6 !important;
          caret-color: #5ebd56 !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        /* Clean Flat Checkbox */
        .custom-checkbox {
          appearance: none;
          background-color: #121114;
          border: 1.5px solid #26232b;
          border-radius: 4px;
          width: 16px;
          height: 16px;
          display: inline-grid;
          place-content: center;
          cursor: pointer;
          transition: all 150ms ease;
        }
        .custom-checkbox:checked {
          background-color: #5ebd56;
          border-color: #53a74c;
        }
        .custom-checkbox::before {
          content: "";
          width: 8px;
          height: 8px;
          transform: scale(0);
          transition: 100ms transform ease-in-out;
          box-shadow: inset 1em 1em #000000;
          clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
        }
        .custom-checkbox:checked::before {
          transform: scale(1);
        }
      ` }} />

      {/* 2. Unified Double-Panel Control Console Card */}
      <div className="w-full max-w-5xl bg-[#1c1a21] border border-[#26232b] rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.5)] flex flex-col md:flex-row min-h-[580px] z-10">

        {/* LEFT PANEL: Crisp, Clean Light Telemetry Dashboard */}
        <div className="w-full md:w-[48%] bg-[#f7f7f9] p-8 md:p-10 flex flex-col justify-between select-none border-b md:border-b-0 md:border-r border-zinc-200">

          {/* Brand Logo - Direct Minimal Float */}
          <div className="flex items-center justify-start w-full">
            <img src="/kalbe_logo.png" alt="Kalbe Logo" className="h-7 w-auto object-contain" />
          </div>

          {/* Telemetry Metrics Board */}
          <div className="my-8 space-y-6">
            <div className="space-y-1">
              <div className="text-[10px] font-bold text-[#48a13d] tracking-widest uppercase font-mono">System Live Telemetry</div>
              <h2 className="text-xl font-bold text-zinc-900 tracking-tight">Active Plant Status</h2>
            </div>

            <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 space-y-4 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">

              {/* Plant line indicator */}
              <div className="flex items-center justify-between text-xs pb-3 border-b border-zinc-100">
                <span className="font-semibold text-zinc-700">Station / Line A4</span>
                <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#48a13d] font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#48a13d] animate-pulse" />
                  ONLINE
                </div>
              </div>

              {/* Core flat metrics list */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">Availability Rate</span>
                  <span className="font-bold font-mono text-zinc-800">94.2%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">Performance Efficiency</span>
                  <span className="font-bold font-mono text-zinc-800">88.5%</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-500 font-medium">Quality Output</span>
                  <span className="font-bold font-mono text-[#48a13d]">99.1%</span>
                </div>
              </div>

              {/* Overall Calculated OEE */}
              <div className="bg-zinc-50 border border-zinc-150 rounded-xl p-3 flex justify-between items-center mt-2">
                <span className="text-[10px] font-bold text-zinc-500 tracking-wider uppercase font-mono">OEE Index</span>
                <span className="text-base font-bold font-mono text-[#48a13d]">82.6%</span>
              </div>
            </div>
          </div>

          {/* Footer Label */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-500 leading-relaxed font-medium">
              PT. Kalbe Morinaga Indonesia. Production Efficiency and Loss Time Monitoring System.
            </p>
            <div className="flex gap-1.5 text-[9px] text-zinc-400 font-bold font-mono uppercase tracking-wider">
              <span>ISOLATED ENV</span>
              <span>•</span>
              <span>SECURE GATEWAY</span>
            </div>
          </div>

        </div>

        {/* RIGHT PANEL: Sleek Space Gray Corporate Login Form */}
        <div className="flex-1 p-8 md:p-12 flex flex-col justify-center bg-[#1c1a21]">

          <div className="max-w-sm w-full mx-auto space-y-6">
            {/* Header titles */}
            <div className="space-y-1.5">
              <h1 className="text-xl font-bold tracking-tight text-white font-mono">
                Sign In to System
              </h1>
              <p className="text-xs text-[#8e8b94] font-medium">
                Enter your credentials below to authorize session.
              </p>
            </div>

            {/* Action Notifications */}
            {error && (
              <div className="p-3.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs font-semibold flex items-center gap-2 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">

              {/* Email input */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-[#8e8b94] tracking-wider uppercase font-mono px-1">Email Address</span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="operator@karyamandiri.co.id"
                  className="w-full px-4 py-2.5 bg-[#121114] border border-[#26232b] focus:border-[#5ebd56]/55 focus:ring-1 focus:ring-[#5ebd56]/10 rounded-xl text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none transition-all duration-200 font-mono"
                />
              </div>

              {/* Password input */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-bold text-[#8e8b94] tracking-wider uppercase font-mono">Security Pin</span>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-2.5 pr-12 bg-[#121114] border border-[#26232b] focus:border-[#5ebd56]/55 focus:ring-1 focus:ring-[#5ebd56]/10 rounded-xl text-xs text-zinc-100 placeholder-zinc-700 focus:outline-none transition-all duration-200 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-650 hover:text-zinc-350 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me option */}
              <div className="flex items-center justify-between py-1 select-none">
                <label className="flex items-center gap-2.5 text-[11px] text-[#8e8b94] cursor-pointer font-medium">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="custom-checkbox"
                  />
                  <span>Maintain session for 30 days</span>
                </label>
              </div>

              {/* Call to action button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 mt-2 bg-[#5ebd56] hover:bg-[#53a74c] active:bg-[#468c40] text-black font-extrabold rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider font-mono shadow-[0_2px_8px_rgba(94,189,86,0.1)]"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Gateway...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Authorize & Sign In</span>
                  </>
                )}
              </button>
            </form>

            {/* Help link */}
            <div className="text-center pt-2">
              <span className="text-[10px] text-[#8e8b94] font-medium">
                System access restricted. Need help?{" "}
                <Link href="/" className="text-[#5ebd56] hover:underline font-semibold transition-colors">
                  Contact Administrator
                </Link>
              </span>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
