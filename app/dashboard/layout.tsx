"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  ClipboardList,
  Database,
  BarChart3,
  Settings,
  LogOut,
  Cpu,
  Package,
  Hash,
  Users,
  ChevronDown,
  ChevronUp,
  Wifi,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [masterDataOpen, setMasterDataOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  // Load sidebar configuration from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("isSidebarHidden");
    if (stored) {
      setIsSidebarHidden(JSON.parse(stored));
    }
  }, []);

  const toggleSidebar = () => {
    const nextVal = !isSidebarHidden;
    setIsSidebarHidden(nextVal);
    localStorage.setItem("isSidebarHidden", JSON.stringify(nextVal));
  };

  // Fetch current user on mount
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);
        } else {
          router.push("/login");
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/login");
      }
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const navItems = [
    {
      name: "OEE & Downtime",
      href: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "OKP Transactions",
      href: "/dashboard/transactions",
      icon: ClipboardList,
    },
  ];

  const masterItems = [
    { name: "Machines", href: "/dashboard/master/machines", icon: Cpu },
    { name: "Products", href: "/dashboard/master/products", icon: Package },
    { name: "Activity Codes", href: "/dashboard/master/activity-codes", icon: Hash },
    { name: "Employees", href: "/dashboard/master/employees", icon: Users },
    { name: "MQTT Config", href: "/dashboard/master/mqtt", icon: Wifi },
  ];

  return (
    <div className="flex h-screen w-screen bg-[#141318] text-[#f4f3f6] font-sans overflow-hidden relative">
      
      {/* 1. SIDEBAR NAVIGATION - Rich Charcoal & Aubergine Tint */}
      <aside className={`flex flex-col justify-between bg-[#1c1a21] border-r border-[#26232b] flex-shrink-0 z-20 relative shadow-[5px_0_20px_rgba(0,0,0,0.4)] transition-all duration-300 ease-in-out ${isSidebarHidden ? "w-16 py-4 px-2" : "w-64 p-4"}`}>
        
        <div className={`flex flex-col gap-6 relative z-10 ${isSidebarHidden ? "w-full" : "w-56"}`}>
          
          {/* Brand Logo & Collapse/Expand Button */}
          <div className={`flex items-center justify-between w-full pb-4 border-b border-[#26232b]/60 select-none ${isSidebarHidden ? "flex-col gap-4 px-1" : "gap-2"}`}>
            {!isSidebarHidden ? (
              <>
                <div className="bg-white/95 px-5 py-2 rounded-full flex items-center justify-center shadow-md border border-white/20 hover:scale-[1.02] transition-transform duration-200">
                  <img src="/kalbe_logo.png" alt="Kalbe Logo" className="h-5.5 w-auto object-contain" />
                </div>
                <button
                  onClick={toggleSidebar}
                  className="p-1.5 hover:bg-[#232029] rounded-lg text-[#8e8b94] hover:text-zinc-200 transition-colors cursor-pointer flex items-center justify-center"
                  title="Collapse Sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={toggleSidebar}
                className="p-2 bg-[#232029] hover:bg-[#2e2a36] rounded-lg text-[#5ebd56] transition-all cursor-pointer flex items-center justify-center shadow-md border border-[#26232b] hover:scale-105 active:scale-95"
                title="Expand Sidebar"
              >
                <ChevronRight className="w-4.5 h-4.5" />
              </button>
            )}
          </div>

          {/* Nav Links */}
          <nav className="flex flex-col gap-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative flex items-center rounded-lg text-xs font-bold tracking-wide transition-all duration-200 border ${
                    isActive
                      ? "bg-[#232029] text-white border-[#5ebd56]/10 shadow-[0_2px_8px_rgba(94,189,86,0.02)]"
                      : "text-[#8e8b94] border-transparent hover:bg-[#232029]/40 hover:text-zinc-200"
                  } ${isSidebarHidden ? "justify-center p-2.5 w-10 h-10 mx-auto" : "gap-3 px-3.5 py-2.5"}`}
                  title={isSidebarHidden ? item.name : undefined}
                >
                  {/* Left Premium Active Indicator Ribbon */}
                  {isActive && (
                    <span className={`absolute top-1/2 -translate-y-1/2 w-[3px] bg-[#5ebd56] rounded-r-md animate-pulse ${isSidebarHidden ? "left-0 h-4" : "left-0 h-5"}`} />
                  )}
                  <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? "text-[#5ebd56] scale-110" : "text-[#8e8b94]"}`} />
                  {!isSidebarHidden && <span>{item.name}</span>}
                </Link>
              );
            })}

            {/* Master Data Dropdown */}
            <div className="flex flex-col">
              {isSidebarHidden ? (
                <button
                  onClick={() => {
                    toggleSidebar();
                    setMasterDataOpen(true);
                  }}
                  className="relative flex items-center justify-center rounded-lg text-xs font-bold transition-all duration-200 border border-transparent hover:bg-[#232029]/40 text-[#8e8b94] hover:text-zinc-200 w-10 h-10 mx-auto p-2.5"
                  title="Master Data"
                >
                  <Database className="w-4 h-4 text-[#8e8b94]" />
                </button>
              ) : (
                <button
                  onClick={() => setMasterDataOpen(!masterDataOpen)}
                  className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg text-xs font-bold tracking-wide text-[#8e8b94] hover:bg-[#232029]/40 hover:text-zinc-200 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-[#8e8b94]" />
                    <span>Master Data</span>
                  </div>
                  {masterDataOpen ? (
                    <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                  )}
                </button>
              )}

              {/* Submenus */}
              {!isSidebarHidden && masterDataOpen && (
                <div className="flex flex-col gap-1 ml-4.5 pl-3 border-l border-[#26232b] mt-1.5 mb-1.5">
                  {masterItems.map((subItem) => {
                    const SubIcon = subItem.icon;
                    const isSubActive = pathname === subItem.href;
                    return (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        className={`relative flex items-center gap-3 px-3 py-2 rounded-md text-[11px] font-bold tracking-wide transition-all border ${
                          isSubActive
                            ? "bg-[#232029] text-white border-[#5ebd56]/10"
                            : "text-[#8e8b94] border-transparent hover:bg-[#232029]/20 hover:text-zinc-200"
                        }`}
                      >
                        {/* Submenu Active left ribbon */}
                        {isSubActive && (
                          <span className="absolute left-[-13px] top-1/2 -translate-y-1/2 w-[3px] h-3.5 bg-[#5ebd56] rounded-r-md" />
                        )}
                        <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? "text-[#5ebd56]" : "text-[#8e8b94]"}`} />
                        {subItem.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Other static links */}
            <Link
              href="/dashboard/analytics"
              className={`relative flex items-center rounded-lg text-xs font-bold tracking-wide transition-all border ${
                pathname === "/dashboard/analytics"
                  ? "bg-[#232029] text-white border-[#5ebd56]/10"
                  : "text-[#8e8b94] border-transparent hover:bg-[#232029]/40 hover:text-zinc-200"
              } ${isSidebarHidden ? "justify-center p-2.5 w-10 h-10 mx-auto" : "gap-3 px-3.5 py-2.5"}`}
              title={isSidebarHidden ? "Pareto Analytics" : undefined}
            >
              {pathname === "/dashboard/analytics" && (
                <span className={`absolute top-1/2 -translate-y-1/2 w-[3px] bg-[#5ebd56] rounded-r-md ${isSidebarHidden ? "left-0 h-4" : "left-0 h-5"}`} />
              )}
              <BarChart3 className={`w-4 h-4 transition-transform duration-200 ${pathname === "/dashboard/analytics" ? "text-[#5ebd56] scale-110" : "text-[#8e8b94]"}`} />
              {!isSidebarHidden && <span>Pareto Analytics</span>}
            </Link>

            <Link
              href="/dashboard/settings"
              className={`relative flex items-center rounded-lg text-xs font-bold tracking-wide transition-all border ${
                pathname === "/dashboard/settings"
                  ? "bg-[#232029] text-white border-[#5ebd56]/10"
                  : "text-[#8e8b94] border-transparent hover:bg-[#232029]/40 hover:text-zinc-200"
              } ${isSidebarHidden ? "justify-center p-2.5 w-10 h-10 mx-auto" : "gap-3 px-3.5 py-2.5"}`}
              title={isSidebarHidden ? "System Config" : undefined}
            >
              {pathname === "/dashboard/settings" && (
                <span className={`absolute top-1/2 -translate-y-1/2 w-[3px] bg-[#5ebd56] rounded-r-md ${isSidebarHidden ? "left-0 h-4" : "left-0 h-5"}`} />
              )}
              <Settings className={`w-4 h-4 transition-transform duration-200 ${pathname === "/dashboard/settings" ? "text-[#5ebd56] scale-110" : "text-[#8e8b94]"}`} />
              {!isSidebarHidden && <span>System Config</span>}
            </Link>
          </nav>
        </div>

        {/* Footer Profile Info */}
        <div className={`flex flex-col pt-4 border-t border-[#26232b] relative z-10 ${isSidebarHidden ? "gap-4 items-center" : "gap-3"}`}>
          {currentUser && (
            <div className={`flex items-center gap-3 ${isSidebarHidden ? "px-0 justify-center" : "px-2"}`}>
              <div
                className="w-8 h-8 rounded-full bg-[#232029] border border-[#26232b] flex items-center justify-center text-[#5ebd56] font-bold text-xs font-mono shadow-sm"
                title={isSidebarHidden ? `${currentUser.email} (${currentUser.role})` : undefined}
              >
                {currentUser.email.charAt(0).toUpperCase()}
              </div>
              {!isSidebarHidden && (
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold text-zinc-200 truncate">{currentUser.email}</p>
                  <p className="text-[9px] text-[#5ebd56] font-extrabold tracking-widest uppercase font-mono mt-0.5">
                    {currentUser.role}
                  </p>
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            className={`flex items-center justify-center bg-rose-500/5 hover:bg-rose-500/10 active:bg-rose-500/15 text-rose-400 rounded-lg text-xs font-bold border border-rose-500/10 transition-colors cursor-pointer font-mono ${isSidebarHidden ? "w-10 h-10" : "w-full py-2 gap-2 tracking-wider"}`}
            title={isSidebarHidden ? "Logout" : undefined}
          >
            <LogOut className="w-4 h-4" />
            {!isSidebarHidden && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col bg-transparent overflow-y-auto z-10 relative">
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
      </main>
    </div>
  );
}
