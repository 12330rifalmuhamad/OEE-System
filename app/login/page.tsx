"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import DashboardLayout from "../dashboard/layout";
import OeeDashboardHome from "../dashboard/page";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

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
    <main className="min-h-screen w-screen relative overflow-hidden flex items-center justify-center p-4 font-sans bg-[var(--bg-base)]">
      
      {/* 1. Blurred background dashboard representation (Hydrates only on client) */}
      {hasMounted && (
        <div className="absolute inset-0 z-0 pointer-events-none select-none filter blur-[8px] opacity-40 dark:opacity-25 scale-[1.01] transition-opacity duration-300">
          <DashboardLayout>
            <OeeDashboardHome />
          </DashboardLayout>
        </div>
      )}

      {/* Dark overlay to increase contrast */}
      <div className="absolute inset-0 bg-zinc-900/10 dark:bg-black/40 z-0 pointer-events-none" />

      {/* Premium Custom CSS Animations and Checkbox Override */}
      <style dangerouslySetInnerHTML={{
        __html: `
        /* Precision Autofill Override */
        input:-webkit-autofill,
        input:-webkit-autofill:hover, 
        input:-webkit-autofill:focus,
        input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 100px var(--bg-input) inset !important;
          -webkit-text-fill-color: var(--text-primary) !important;
          caret-color: #5ebd56 !important;
          transition: background-color 5000s ease-in-out 0s;
        }

        /* Clean Flat Checkbox */
        .custom-checkbox {
          appearance: none;
          background-color: var(--bg-input);
          border: 1.5px solid var(--border-color);
          border-radius: 4px;
          width: 15px;
          height: 15px;
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
          width: 7px;
          height: 7px;
          transform: scale(0);
          transition: 100ms transform ease-in-out;
          box-shadow: inset 1em 1em #000000;
          clip-path: polygon(14% 44%, 0 65%, 50% 100%, 100% 16%, 80% 0%, 43% 62%);
        }
        .custom-checkbox:checked::before {
          transform: scale(1);
        }

        /* Static Ambient Shadow & Glow */
        .static-card-shadow {
          box-shadow: 0 20px 50px -10px rgba(27, 46, 34, 0.1), 0 10px 20px -10px rgba(0,0,0,0.04);
          transition: all 0.3s ease;
        }

        [data-theme="dark"] .static-card-shadow {
          box-shadow: 0 30px 70px -10px rgba(0, 0, 0, 0.65), 0 0 25px -5px rgba(94, 189, 86, 0.04);
          border-color: rgba(38, 35, 43, 0.8);
        }

        .static-card-shadow:hover {
          box-shadow: 0 25px 55px -10px rgba(27, 46, 34, 0.15), 0 12px 25px -10px rgba(0,0,0,0.06);
        }

        [data-theme="dark"] .static-card-shadow:hover {
          border-color: rgba(94, 189, 86, 0.2);
          box-shadow: 0 35px 80px -10px rgba(0, 0, 0, 0.75), 0 0 35px -5px rgba(94, 189, 86, 0.08);
        }
      ` }} />

      {/* 2. Glassmorphic Floating Login Card - Ultra Elegant & Compact (Static) */}
      <div className="z-10 w-full max-w-sm bg-[var(--bg-card)]/85 backdrop-blur-2xl border border-[var(--border-color)]/80 rounded-3xl p-6 flex flex-col gap-5 transition-all duration-300 static-card-shadow">
        
        {/* Brand Logo & Compact Header */}
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="bg-white px-4 py-2 rounded-full flex items-center justify-center shadow-sm border border-zinc-200/50 hover:scale-[1.02] transition-transform duration-200">
            <img src="/kalbe_logo.png" alt="Kalbe Logo" className="h-5 w-auto object-contain" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-base font-extrabold tracking-tight text-[var(--text-primary)] font-mono uppercase">
              OEE Telemetry Gateway
            </h1>
            <p className="text-[10px] text-[var(--text-secondary)] font-medium font-mono leading-normal px-2">
              Sign in to manage active lines & production OKPs
            </p>
          </div>
        </div>

        {/* Action Notifications */}
        {error && (
          <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold flex items-center gap-2 font-mono animate-fadeIn">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3.5">

          {/* Email Address */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-extrabold text-[var(--text-secondary)] tracking-wider uppercase font-mono px-1">Email Address</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@karyamandiri.co.id"
              className="w-full px-3.5 py-2.5 bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[#5ebd56]/50 focus:ring-1 focus:ring-[#5ebd56]/15 rounded-xl text-xs text-[var(--text-primary)] placeholder-zinc-500/70 focus:outline-none transition-all duration-200 font-mono"
            />
          </div>

          {/* Security Pin / Password */}
          <div className="flex flex-col gap-1">
            <span className="text-[9px] font-extrabold text-[var(--text-secondary)] tracking-wider uppercase font-mono px-1">Security Pin</span>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 pr-10 bg-[var(--bg-input)] border border-[var(--border-color)] focus:border-[#5ebd56]/50 focus:ring-1 focus:ring-[#5ebd56]/15 rounded-xl text-xs text-[var(--text-primary)] placeholder-zinc-500/70 focus:outline-none transition-all duration-200 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Remember Option */}
          <div className="flex items-center justify-between py-0.5 select-none">
            <label className="flex items-center gap-2 text-[10px] text-[var(--text-secondary)] cursor-pointer font-bold font-mono">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="custom-checkbox"
              />
              <span>Remember session</span>
            </label>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 mt-1 bg-[#5ebd56] hover:bg-[#53a74c] active:bg-[#468c40] text-black font-extrabold rounded-xl text-xs transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed uppercase tracking-wider font-mono shadow-[0_2px_8px_rgba(94,189,86,0.1)] hover:shadow-[0_4px_12px_rgba(94,189,86,0.2)]"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Sign In Gateway</span>
              </>
            )}
          </button>
        </form>

        {/* Compact Footer Back Link & Copyright */}
        <div className="flex flex-col items-center gap-2.5 pt-3.5 border-t border-[var(--border-color)]/60 text-center">
          <Link
            href="/dashboard"
            className="text-[10px] text-[#5ebd56] hover:text-[#53a74c] hover:underline font-extrabold tracking-wider uppercase font-mono transition-colors"
          >
            ← Back to Telemetry Hub (Guest)
          </Link>
          <span className="text-[9px] text-[var(--text-secondary)] font-mono tracking-wide">
            PT. Kalbe Morinaga Indonesia
          </span>
        </div>
      </div>
    </main>
  );
}
