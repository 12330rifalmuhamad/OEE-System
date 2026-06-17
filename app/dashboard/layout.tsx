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
  LogIn,
  Sun,
  Moon,
  Monitor,
  GitCommit,
  ListTodo,
} from "lucide-react";
import RealtimePopup from "./RealtimePopup";


export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const isKioskMode = pathname === "/dashboard/kiosk";
  const [masterDataOpen, setMasterDataOpen] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isSidebarHidden, setIsSidebarHidden] = useState(false);

  const [theme, setTheme] = useState<"light" | "dark" | "system">("system");

  // Load theme and sidebar configuration from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem("theme") as "light" | "dark" | "system" || "system";
    setTheme(storedTheme);

    const storedSidebar = localStorage.getItem("isSidebarHidden");
    if (storedSidebar) {
      setIsSidebarHidden(JSON.parse(storedSidebar));
    }
  }, []);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    const root = document.documentElement;
    if (newTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.setAttribute("data-theme", systemTheme);
    } else {
      root.setAttribute("data-theme", newTheme);
    }
  };

  const toggleSidebar = () => {
    const nextVal = !isSidebarHidden;
    setIsSidebarHidden(nextVal);
    localStorage.setItem("isSidebarHidden", JSON.stringify(nextVal));
  };

  // Fetch current user on mount & path transitions
  useEffect(() => {
    async function fetchUser() {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          setCurrentUser(data.user);

          // If no user is logged in (Guest Mode) and they are on a protected path, redirect to login
          if (!data.user) {
            const protectedPaths = [
              "/dashboard/master",
              "/dashboard/settings",
            ];
            const isProtected = protectedPaths.some(path => pathname.startsWith(path)) || pathname.includes("/adjust");
            if (isProtected) {
              router.push("/login");
            }
          }
        } else {
          // Default to guest mode
          setCurrentUser(null);
          const protectedPaths = [
            "/dashboard/master",
            "/dashboard/settings",
          ];
          const isProtected = protectedPaths.some(path => pathname.startsWith(path)) || pathname.includes("/adjust");
          if (isProtected) {
            router.push("/login");
          }
        }
      } catch (err) {
        console.error(err);
      }
    }
    fetchUser();
  }, [router, pathname]);


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
    {
      name: "DMS Board",
      href: "/dashboard/dms",
      icon: ListTodo,
    },
    {
      name: "Dashboard View",
      href: "/dashboard/kiosk",
      icon: Monitor,
    },
  ];

  const masterItems = [
    { name: "Machines", href: "/dashboard/master/machines", icon: Cpu },
    { name: "Products", href: "/dashboard/master/products", icon: Package },
    { name: "Activity Codes", href: "/dashboard/master/activity-codes", icon: Hash },
    { name: "Employees", href: "/dashboard/master/employees", icon: Users },
    { name: "MQTT Config", href: "/dashboard/master/mqtt", icon: Wifi },
    { name: "Line Process", href: "/dashboard/master/line-process", icon: GitCommit },
  ];

  return (
    <div className="flex h-screen w-screen bg-[var(--bg-base)] text-[var(--text-primary)] font-sans overflow-hidden relative transition-colors duration-200">

      {/* 1. SIDEBAR NAVIGATION - Premium Adaptive Theme */}
      <aside className={`${isKioskMode ? "hidden" : "flex"} flex-col justify-between bg-[var(--bg-sidebar)] border-r border-[var(--border-sidebar)] flex-shrink-0 z-20 relative shadow-[5px_0_20px_rgba(0,0,0,0.05)] dark:shadow-[5px_0_20px_rgba(0,0,0,0.4)] transition-all duration-300 ease-in-out ${isSidebarHidden ? "w-16 py-4 px-2" : "w-64 p-4"}`}>

        <div className={`flex flex-col gap-6 relative z-10 ${isSidebarHidden ? "w-full" : "w-56"}`}>

          {/* Brand Logo & Collapse/Expand Button */}
          <div className={`flex items-center justify-between w-full pb-4 border-b border-[var(--border-sidebar)]/60 select-none ${isSidebarHidden ? "flex-col gap-4 px-1" : "gap-2"}`}>
            {!isSidebarHidden ? (
              <>
                <div className="bg-white/95 px-5 py-2 rounded-full flex items-center justify-center shadow-sm border border-white/20 hover:scale-[1.02] transition-transform duration-200">
                  <img src="/kalbe_logo.png" alt="Kalbe Logo" className="h-5.5 w-auto object-contain" />
                </div>
                <button
                  onClick={toggleSidebar}
                  className="p-1.5 hover:bg-[var(--sidebar-hover-bg)] rounded-lg text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-hover)] transition-colors cursor-pointer flex items-center justify-center"
                  title="Collapse Sidebar"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={toggleSidebar}
                className="p-2 bg-[var(--sidebar-hover-bg)] hover:bg-[var(--sidebar-hover-bg)]/80 rounded-lg text-[var(--sidebar-active-border)] transition-all cursor-pointer flex items-center justify-center shadow-md border border-[var(--border-sidebar)] hover:scale-105 active:scale-95"
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
                  className={`relative flex items-center rounded-lg text-xs font-bold tracking-wide transition-all duration-200 border ${isActive
                      ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] border-transparent shadow-sm"
                      : "text-[var(--sidebar-text)] border-transparent hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text-hover)]"
                    } ${isSidebarHidden ? "justify-center p-2.5 w-10 h-10 mx-auto" : "gap-3 px-3.5 py-2.5"}`}
                  title={isSidebarHidden ? item.name : undefined}
                >
                  {/* Left Premium Active Indicator Ribbon */}
                  {isActive && (
                    <span className={`absolute top-1/2 -translate-y-1/2 w-[3px] bg-[var(--sidebar-active-border)] rounded-r-md animate-pulse ${isSidebarHidden ? "left-0 h-4" : "left-0 h-5"}`} />
                  )}
                  <Icon className={`w-4 h-4 transition-transform duration-200 ${isActive ? "text-[var(--sidebar-active-text)] scale-110" : "text-[var(--sidebar-text)]"}`} />
                  {!isSidebarHidden && <span>{item.name}</span>}
                </Link>
              );
            })}

            {/* Master Data Dropdown - ONLY FOR LOGGED IN USERS */}
            {currentUser && (
              <div className="flex flex-col">
                {isSidebarHidden ? (
                  <button
                    onClick={() => {
                      toggleSidebar();
                      setMasterDataOpen(true);
                    }}
                    className="relative flex items-center justify-center rounded-lg text-xs font-bold transition-all duration-200 border border-transparent hover:bg-[var(--sidebar-hover-bg)] text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-hover)] w-10 h-10 mx-auto p-2.5"
                    title="Master Data"
                  >
                    <Database className="w-4 h-4 text-[var(--sidebar-text)]" />
                  </button>
                ) : (
                  <button
                    onClick={() => setMasterDataOpen(!masterDataOpen)}
                    className="flex items-center justify-between w-full px-3.5 py-2.5 rounded-lg text-xs font-bold tracking-wide text-[var(--sidebar-text)] hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text-hover)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Database className="w-4 h-4 text-[var(--sidebar-text)]" />
                      <span>Master Data</span>
                    </div>
                    {masterDataOpen ? (
                      <ChevronUp className="w-3.5 h-3.5 text-[var(--sidebar-text)]/70" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-[var(--sidebar-text)]/70" />
                    )}
                  </button>
                )}

                {/* Submenus */}
                {!isSidebarHidden && masterDataOpen && (
                  <div className="flex flex-col gap-1 ml-4.5 pl-3 border-l border-[var(--border-sidebar)] mt-1.5 mb-1.5">
                    {masterItems.map((subItem) => {
                      const SubIcon = subItem.icon;
                      const isSubActive = pathname === subItem.href;
                      return (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`relative flex items-center gap-3 px-3 py-2 rounded-md text-[11px] font-bold tracking-wide transition-all border ${isSubActive
                              ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] border-transparent"
                              : "text-[var(--sidebar-text)] border-transparent hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text-hover)]"
                            }`}
                        >
                          {/* Submenu Active left ribbon */}
                          {isSubActive && (
                            <span className="absolute left-[-13px] top-1/2 -translate-y-1/2 w-[3px] h-3.5 bg-[var(--sidebar-active-border)] rounded-r-md" />
                          )}
                          <SubIcon className={`w-3.5 h-3.5 ${isSubActive ? "text-[var(--sidebar-active-text)]" : "text-[var(--sidebar-text)]"}`} />
                          {subItem.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Other static links */}
            <Link
              href="/dashboard/analytics"
              className={`relative flex items-center rounded-lg text-xs font-bold tracking-wide transition-all border ${pathname === "/dashboard/analytics"
                  ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] border-transparent"
                  : "text-[var(--sidebar-text)] border-transparent hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text-hover)]"
                } ${isSidebarHidden ? "justify-center p-2.5 w-10 h-10 mx-auto" : "gap-3 px-3.5 py-2.5"}`}
              title={isSidebarHidden ? "Pareto Analytics" : undefined}
            >
              {pathname === "/dashboard/analytics" && (
                <span className={`absolute top-1/2 -translate-y-1/2 w-[3px] bg-[var(--sidebar-active-border)] rounded-r-md ${isSidebarHidden ? "left-0 h-4" : "left-0 h-5"}`} />
              )}
              <BarChart3 className={`w-4 h-4 transition-transform duration-200 ${pathname === "/dashboard/analytics" ? "text-[var(--sidebar-active-text)] scale-110" : "text-[var(--sidebar-text)]"}`} />
              {!isSidebarHidden && <span>Pareto Analytics</span>}
            </Link>

            {/* System Config - ONLY FOR LOGGED IN USERS */}
            {currentUser && (
              <Link
                href="/dashboard/settings"
                className={`relative flex items-center rounded-lg text-xs font-bold tracking-wide transition-all border ${pathname === "/dashboard/settings"
                    ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] border-transparent"
                    : "text-[var(--sidebar-text)] border-transparent hover:bg-[var(--sidebar-hover-bg)] hover:text-[var(--sidebar-text-hover)]"
                  } ${isSidebarHidden ? "justify-center p-2.5 w-10 h-10 mx-auto" : "gap-3 px-3.5 py-2.5"}`}
                title={isSidebarHidden ? "System Config" : undefined}
              >
                {pathname === "/dashboard/settings" && (
                  <span className={`absolute top-1/2 -translate-y-1/2 w-[3px] bg-[var(--sidebar-active-border)] rounded-r-md ${isSidebarHidden ? "left-0 h-4" : "left-0 h-5"}`} />
                )}
                <Settings className={`w-4 h-4 transition-transform duration-200 ${pathname === "/dashboard/settings" ? "text-[var(--sidebar-active-text)] scale-110" : "text-[var(--sidebar-text)]"}`} />
                {!isSidebarHidden && <span>System Config</span>}
              </Link>
            )}
          </nav>
        </div>

        {/* Footer Profile & Theme Panel */}
        <div className={`flex flex-col pt-4 border-t border-[var(--border-sidebar)] relative z-10 ${isSidebarHidden ? "gap-4 items-center" : "gap-3.5"}`}>

          {/* Theme Selector Component */}
          {!isSidebarHidden ? (
            <div className="flex items-center bg-[var(--sidebar-hover-bg)] border border-[var(--border-sidebar)] p-1 rounded-xl w-full justify-between mt-1">
              <button
                onClick={() => handleThemeChange("light")}
                className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all font-mono cursor-pointer ${theme === "light"
                  ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] shadow-sm font-extrabold"
                  : "text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-hover)]"
                  }`}
                title="Light Theme"
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Light</span>
              </button>
              <button
                onClick={() => handleThemeChange("dark")}
                className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all font-mono cursor-pointer ${theme === "dark"
                  ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] shadow-sm font-extrabold"
                  : "text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-hover)]"
                  }`}
                title="Night Theme"
              >
                <Moon className="w-3.5 h-3.5" />
                <span>Night</span>
              </button>
              <button
                onClick={() => handleThemeChange("system")}
                className={`flex-1 py-1.5 flex items-center justify-center gap-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all font-mono cursor-pointer ${theme === "system"
                  ? "bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)] shadow-sm font-extrabold"
                  : "text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-hover)]"
                  }`}
                title="System Default"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span>System</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                const nextThemes: Record<string, "light" | "dark" | "system"> = {
                  light: "dark",
                  dark: "system",
                  system: "light",
                };
                handleThemeChange(nextThemes[theme]);
              }}
              className="w-10 h-10 rounded-lg bg-[var(--sidebar-hover-bg)] border border-[var(--border-sidebar)] flex items-center justify-center text-[var(--sidebar-text)] hover:text-[var(--sidebar-text-hover)] transition-all cursor-pointer shadow-md"
              title={`Theme: ${theme.toUpperCase()} (Click to toggle)`}
            >
              {theme === "light" && <Sun className="w-4 h-4" />}
              {theme === "dark" && <Moon className="w-4 h-4" />}
              {theme === "system" && <Monitor className="w-4 h-4" />}
            </button>
          )}

          {/* User Profile avatar/details & Login/Logout button */}
          {currentUser ? (
            <>
              <div className={`flex items-center gap-3 ${isSidebarHidden ? "px-0 justify-center" : "px-2"}`}>
                <div
                  className="w-8 h-8 rounded-full bg-[var(--sidebar-hover-bg)] border border-[var(--border-sidebar)] flex items-center justify-center text-[var(--sidebar-text-hover)] font-bold text-xs font-mono shadow-sm"
                  title={isSidebarHidden ? `${currentUser.email} (${currentUser.role})` : undefined}
                >
                  {currentUser.email.charAt(0).toUpperCase()}
                </div>
                {!isSidebarHidden && (
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-white truncate">{currentUser.email}</p>
                    <p className="text-[9px] text-[var(--sidebar-active-border)] font-extrabold tracking-widest uppercase font-mono mt-0.5">
                      {currentUser.role}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className={`flex items-center justify-center bg-rose-550/5 hover:bg-rose-500/10 active:bg-rose-500/15 text-rose-300 rounded-lg text-xs font-bold border border-rose-500/10 transition-colors cursor-pointer font-mono ${isSidebarHidden ? "w-10 h-10" : "w-full py-2.5 gap-2 tracking-wider"}`}
                title={isSidebarHidden ? "Logout" : undefined}
              >
                <LogOut className="w-4 h-4" />
                {!isSidebarHidden && <span>Logout</span>}
              </button>
            </>
          ) : (
            <>
              <div className={`flex items-center gap-3 ${isSidebarHidden ? "px-0 justify-center" : "px-2"}`}>
                <div
                  className="w-8 h-8 rounded-full bg-[var(--sidebar-hover-bg)] border border-[var(--border-sidebar)] flex items-center justify-center text-[var(--sidebar-active-border)] font-bold text-xs font-mono shadow-sm"
                  title={isSidebarHidden ? "Guest Mode (Read-Only)" : undefined}
                >
                  G
                </div>
                {!isSidebarHidden && (
                  <div className="overflow-hidden">
                    <p className="text-xs font-semibold text-white truncate">Guest Mode</p>
                    <p className="text-[9px] text-[var(--sidebar-active-border)] font-extrabold tracking-widest uppercase font-mono mt-0.5 animate-pulse">
                      READ-ONLY
                    </p>
                  </div>
                )}
              </div>
              <Link
                href="/login"
                className={`flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold border border-white/20 transition-colors cursor-pointer font-mono ${isSidebarHidden ? "w-10 h-10" : "w-full py-2.5 gap-2 tracking-wider uppercase font-bold"}`}
                title={isSidebarHidden ? "Login" : undefined}
              >
                <LogIn className="w-4 h-4" />
                {!isSidebarHidden && <span>Login</span>}
              </Link>
            </>
          )}
        </div>
      </aside>

      {/* 2. MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col bg-transparent overflow-y-auto z-10 relative">
        {/* Futuristic Tech Grid Background */}
        <div className="tech-bg">
          <div className="tech-grid" />
        </div>
        <div className="relative z-10 flex-1 flex flex-col">
          {children}
        </div>
      </main>
      <RealtimePopup />
    </div>
  );
}
