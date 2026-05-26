"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [role, setRole] = useState("OWNER");
  const [subscription, setSubscription] = useState("FREE");
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!agreeTerms) {
      setError("Anda harus menyetujui Syarat & Ketentuan.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role,
          companyName,
          subscription,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Registrasi gagal.");
      }

      setSuccess("Registrasi berhasil! Mengarahkan Anda ke halaman masuk...");
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Gagal mendaftar. Coba lagi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#181524] text-white flex flex-col md:flex-row overflow-hidden font-sans">
      
      {/* LEFT PANEL: Branding & Visual Artwork */}
      <div className="w-full md:w-[48%] bg-[#13101c] p-8 md:p-12 flex flex-col justify-between relative overflow-hidden min-h-[340px] md:min-h-screen">
        
        {/* Dune Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-[#160b29] via-[#10091d] to-[#25103c] opacity-60 z-0" />
        
        {/* Sand Ripple Curved Vector Layers (Pure SVG background artwork) */}
        <svg className="absolute inset-0 w-full h-full object-cover opacity-35 z-0" viewBox="0 0 1000 1000" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M 0,400 C 300,350 600,450 1000,300 L 1000,1000 L 0,1000 Z" fill="#1b122c" />
          <path d="M 0,550 C 400,500 700,600 1000,480 L 1000,1000 L 0,1000 Z" fill="#25173e" />
          <path d="M 0,720 C 300,680 600,800 1000,680 L 1000,1000 L 0,1000 Z" fill="#2d1c4c" />
        </svg>

        {/* Top Header */}
        <div className="flex justify-between items-center relative z-10 w-full">
          {/* Logo brand */}
          <div className="flex items-center gap-1.5 select-none">
            <span className="font-extrabold text-2xl tracking-widest bg-gradient-to-r from-zinc-100 to-zinc-400 bg-clip-text text-transparent font-mono">
              KMI OEE
            </span>
          </div>
          <Link
            href="/"
            className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-xs font-medium hover:bg-white/10 transition-all flex items-center gap-1"
          >
            <span>Back to website</span>
            <span className="text-[10px]">→</span>
          </Link>
        </div>

        {/* Bottom Headline & Pagination */}
        <div className="relative z-10 flex flex-col gap-8 mt-auto pt-16">
          <h2 className="text-3xl md:text-4xl font-semibold leading-[1.3] text-zinc-100 tracking-tight max-w-md">
            Measuring Efficiency, Elevating Production
          </h2>
          
          {/* Custom Slider dots indicator */}
          <div className="flex gap-2">
            <span className="w-8 h-1 rounded-full bg-zinc-700/50" />
            <span className="w-8 h-1 rounded-full bg-zinc-700/50" />
            <span className="w-8 h-1 rounded-full bg-white transition-all" />
          </div>
        </div>

      </div>

      {/* RIGHT PANEL: Form Block */}
      <div className="flex-1 bg-[#1c182a] px-6 py-10 md:px-20 md:py-12 flex flex-col justify-center max-w-[620px] mx-auto w-full overflow-y-auto">
        
        <div className="space-y-2 mb-6">
          <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-white">
            Create an account
          </h1>
          <p className="text-sm text-zinc-400">
            Already have an account?{" "}
            <Link href="/login" className="text-[#8463f9] hover:underline transition-colors font-medium">
              Log in
            </Link>
          </p>
        </div>

        {/* Action Notifications */}
        {error && (
          <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          
          {/* Company Name */}
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Nama Pabrik / Perusahaan"
              className="w-full px-4 py-2.5 bg-[#13101c] border border-[#2f2746] focus:border-[#7d5df6] focus:ring-1 focus:ring-[#7d5df6] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all"
            />
          </div>

          {/* Email input */}
          <div className="flex flex-col gap-1.5">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-2.5 bg-[#13101c] border border-[#2f2746] focus:border-[#7d5df6] focus:ring-1 focus:ring-[#7d5df6] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all"
            />
          </div>

          {/* Password input */}
          <div className="relative flex flex-col gap-1.5">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full px-4 py-2.5 pr-12 bg-[#13101c] border border-[#2f2746] focus:border-[#7d5df6] focus:ring-1 focus:ring-[#7d5df6] rounded-xl text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none transition-all"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Role & Subscription Selection row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 px-1">Hak Akses</span>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#13101c] border border-[#2f2746] focus:border-[#7d5df6] rounded-xl text-sm text-zinc-100 focus:outline-none transition-all cursor-pointer"
              >
                <option value="OWNER">Owner</option>
                <option value="MANAGER">Manager</option>
                <option value="OPERATOR">Operator</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[10px] uppercase font-bold text-zinc-500 px-1">Paket Layanan</span>
              <select
                value={subscription}
                onChange={(e) => setSubscription(e.target.value)}
                className="w-full px-3 py-2.5 bg-[#13101c] border border-[#2f2746] focus:border-[#7d5df6] rounded-xl text-sm text-zinc-100 focus:outline-none transition-all cursor-pointer"
              >
                <option value="FREE">Free Tier</option>
                <option value="PRO">Pro Plan</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
          </div>

          {/* Agreement / Terms Checkbox */}
          <div className="flex items-center justify-between py-1">
            <label className="flex items-center gap-2.5 text-xs text-zinc-400 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                required
                className="w-4 h-4 rounded bg-[#13101c] border-[#2f2746] text-[#7d5df6] focus:ring-0 cursor-pointer"
              />
              <span>I agree to the <span className="text-[#8463f9] hover:underline font-medium">Terms & Conditions</span></span>
            </label>
          </div>

          {/* Call to action button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-[#6d55c7] hover:bg-[#7e67db] active:bg-[#5b45a9] text-white font-bold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-[#6d55c7]/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create account</span>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative flex items-center justify-center my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#2f2746]/50"></div>
          </div>
          <span className="relative px-4 text-xs uppercase tracking-wider text-zinc-500 bg-[#1c182a]">
            Or register with
          </span>
        </div>

        {/* Social Authentication Grid */}
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            className="flex items-center justify-center gap-2.5 px-4 py-2.5 border border-[#2f2746] bg-transparent hover:bg-white/5 rounded-xl text-sm text-zinc-200 transition-colors cursor-pointer"
          >
            {/* Google Icon */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3A11.966 11.966 0 0 0 12 0C7.054 0 2.815 3.024 1.05 7.37L5.266 9.765z"
              />
              <path
                fill="#34A853"
                d="M16.04 15.345c-1.07.727-2.43 1.164-4.04 1.164a7.077 7.077 0 0 1-6.734-4.855L1.05 14.05A11.966 11.966 0 0 0 12 24c3.245 0 6.19-1.077 8.361-2.91l-4.32-3.745z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.273c0-.818-.073-1.609-.208-2.373H12v4.582h6.48c-.28 1.482-1.12 2.74-2.38 3.59l4.32 3.745c2.53-2.336 3.99-5.772 3.99-9.544z"
              />
              <path
                fill="#FBBC05"
                d="M5.266 14.235A7.098 7.098 0 0 1 4.91 12c0-.79.13-1.554.356-2.265L1.05 7.37A11.944 11.944 0 0 0 0 12c0 1.682.35 3.282.97 4.735l4.296-2.5z"
              />
            </svg>
            <span>Google</span>
          </button>
          <button
            type="button"
            className="flex items-center justify-center gap-2.5 px-4 py-2.5 border border-[#2f2746] bg-transparent hover:bg-white/5 rounded-xl text-sm text-zinc-200 transition-colors cursor-pointer"
          >
            {/* Apple Icon */}
            <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.5-.62.72-1.16 1.86-1.01 2.97 1.12.09 2.27-.6 2.94-1.41z" />
            </svg>
            <span>Apple</span>
          </button>
        </div>

      </div>
    </main>
  );
}
