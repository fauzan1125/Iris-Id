"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  Camera, 
  LayoutDashboard, 
  Users, 
  SlidersHorizontal, 
  ScanFace,
  Clock,
  LogOut,
  Briefcase,
  ShieldCheck
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [timeStr, setTimeStr] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute dynamic navigation links based on authenticated role
  const getNavLinks = () => {
    if (!user) {
      // Unauthenticated: Strictly no navigation links
      return [];
    }

    if (user.role === "EMPLOYEE") {
      return [
        { href: "/", label: "Presensi Wajah", icon: Camera },
        { href: "/dashboard", label: "Dashboard Saya", icon: LayoutDashboard },
      ];
    }

    if (user.role === "MANAGER") {
      return [
        { href: "/manager", label: "Monitoring Tim", icon: Briefcase },
        { href: "/", label: "Presensi Mandiri", icon: Camera },
        { href: "/dashboard", label: "Dashboard Saya", icon: LayoutDashboard },
      ];
    }

    // Role ADMIN
    return [
      { href: "/admin", label: "Dashboard HR", icon: LayoutDashboard },
      { href: "/admin/employees", label: "Karyawan & Biometrik", icon: Users },
      { href: "/admin/settings", label: "Pengaturan Kantor", icon: SlidersHorizontal },
      { href: "/", label: "Kamera Presensi", icon: Camera },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <>
      {/* Top Navbar Header */}
      <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Corporate Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-700 flex items-center justify-center text-white shadow-sm">
              <ScanFace className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-base sm:text-lg tracking-tight text-slate-900 block leading-tight">
                IRIS ID
              </span>
              <span className="text-[11px] font-medium text-slate-500 block leading-tight">
                Biometric Attendance System
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links (Only shown when authenticated) */}
          {user && navLinks.length > 0 && (
            <nav className="hidden md:flex items-center gap-1">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors",
                      isActive
                        ? "bg-blue-50 text-blue-700 font-semibold"
                        : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}

          {/* User Profile / Status & Clock */}
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-mono font-medium text-slate-700 border border-slate-200">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{timeStr || "--:--:--"}</span>
            </div>

            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">
                    {user.role} {user.department_name ? `• ${user.department_name}` : ""}
                  </span>
                </div>
                <button
                  onClick={logout}
                  title="Keluar dari akun"
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 text-xs font-medium transition min-h-[36px]"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
                <span>Portal Terproteksi</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar (Only active when logged in) */}
      {user && navLinks.length > 0 && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around safe-bottom">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center flex-1 py-1 px-1 min-h-[48px] rounded-lg text-xs transition-colors",
                  isActive
                    ? "text-blue-700 font-bold bg-blue-50"
                    : "text-slate-500 hover:text-slate-900"
                )}
              >
                <Icon className={cn("w-5 h-5 mb-0.5", isActive ? "text-blue-700" : "text-slate-500")} />
                <span className="text-[10px] leading-tight text-center truncate max-w-[70px]">
                  {item.label}
                </span>
              </Link>
            );
          })}

          <button
            onClick={logout}
            className="flex flex-col items-center justify-center flex-1 py-1 px-1 min-h-[48px] rounded-lg text-xs text-rose-600 hover:bg-rose-50 transition-colors"
          >
            <LogOut className="w-5 h-5 mb-0.5 text-rose-600" />
            <span className="text-[10px] leading-tight text-center">Keluar</span>
          </button>
        </div>
      )}
    </>
  );
}
