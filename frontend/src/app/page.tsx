"use client";

import Link from "next/link";
import { AttendanceCamera } from "@/components/AttendanceCamera";
import { useAuth } from "@/context/AuthContext";
import { ShieldCheck, CalendarDays, UserCheck, ArrowRight } from "lucide-react";

export default function AttendancePage() {
  const { user, isLoading } = useAuth();
  const currentDate = new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (isLoading || !user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center text-slate-500">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Mengarahkan ke halaman login...</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4">
      {/* Logged-In User Banner */}
      {user && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-700 shrink-0" />
            <span>
              Akun Aktif: <strong>{user.name}</strong> ({user.role})
            </span>
          </div>
          <Link
            href={user.role === "EMPLOYEE" ? "/dashboard" : user.role === "MANAGER" ? "/manager" : "/admin"}
            className="font-semibold text-blue-700 hover:underline flex items-center gap-1 shrink-0"
          >
            <span>Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      {/* Page Title & Information Banner */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 text-xs font-medium">
          <CalendarDays className="w-3.5 h-3.5 text-slate-500" />
          <span>{currentDate}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Presensi Kehadiran
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto">
          Posisikan wajah Anda pada kamera dan pastikan GPS aktif untuk memvalidasi lokasi kantor.
        </p>
      </div>

      {/* Main Attendance Camera Component */}
      <AttendanceCamera />

      {/* Corporate Guidance Footnote */}
      <div className="bg-white rounded-xl border border-slate-200 p-3.5 sm:p-4 text-xs text-slate-500 space-y-1.5">
        <div className="font-semibold text-slate-700 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
          Petunjuk Presensi Mandiri
        </div>
        <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
          <li>Pastikan pencahayaan cukup dan wajah tidak tertutup masker atau kacamata gelap.</li>
          <li>Izinkan akses lokasi GPS presisi tinggi pada browser ponsel Anda.</li>
          <li>Gunakan tombol di atas kamera jika ingin mengganti ke kamera belakang/depan.</li>
        </ul>
      </div>
    </div>
  );
}
