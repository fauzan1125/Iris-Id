"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { fetchAttendances } from "@/lib/api";
import { AttendanceRecord } from "@/types";
import { AttendanceLogTable } from "@/components/AttendanceLogTable";
import { 
  UserCheck, 
  Clock, 
  Calendar, 
  Camera, 
  Building2, 
  ShieldCheck, 
  ArrowRight,
  LogIn,
  LogOut,
  RefreshCw
} from "lucide-react";
import { StatusBadge } from "@/components/StatusBadge";
import { formatTime } from "@/lib/utils";

export default function EmployeeDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadMyAttendances = async () => {
    if (!user?.employee_id) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await fetchAttendances({ employee_id: user.employee_id });
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMyAttendances();
    }
  }, [user]);

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-500">
        <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-blue-600" />
        <p className="text-sm">Memuat profil karyawan...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-4">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <ShieldCheck className="w-10 h-10 text-blue-600 mx-auto" />
          <h2 className="font-bold text-lg text-slate-900">Silakan Masuk Terlebih Dahulu</h2>
          <p className="text-xs text-slate-500">
            Anda perlu masuk dengan akun karyawan untuk melihat dashboard kehadiran pribadi Anda.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition"
          >
            <span>Masuk ke Akun</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Find today's clock in and clock out
  const todayStr = new Date().toISOString().split("T")[0];
  const todayRecords = records.filter((r) => r.timestamp.startsWith(todayStr));
  const todayClockIn = todayRecords.find((r) => r.attendance_type === "CLOCK_IN");
  const todayClockOut = todayRecords.find((r) => r.attendance_type === "CLOCK_OUT");

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Employee Profile Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 border border-blue-200 text-blue-700 flex items-center justify-center font-bold text-xl shrink-0">
            {user.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900">{user.name}</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                {user.role}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              NIK: {user.nik || "-"} • {user.email}
            </p>
            <p className="text-xs text-slate-600 mt-1 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Departemen: <strong>{user.department_name || "Kantor Pusat"}</strong></span>
            </p>
          </div>
        </div>

        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition min-h-[44px]"
        >
          <Camera className="w-4 h-4" />
          <span>Buka Kamera Presensi</span>
        </Link>
      </div>

      {/* Today's Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Clock In Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <LogIn className="w-4 h-4 text-emerald-600" />
              Presensi Masuk Hari Ini
            </span>
            {todayClockIn && <StatusBadge status={todayClockIn.status} />}
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {todayClockIn ? formatTime(todayClockIn.timestamp.split("T")[1]) : "--:--:--"}
          </div>
          <p className="text-xs text-slate-500">
            {todayClockIn
              ? `Tercatat pada jarak ${todayClockIn.distance_meters.toFixed(1)}m dari kantor.`
              : "Belum melakukan presensi masuk hari ini."}
          </p>
        </div>

        {/* Clock Out Status */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <LogOut className="w-4 h-4 text-slate-600" />
              Presensi Pulang Hari Ini
            </span>
            {todayClockOut && <StatusBadge status={todayClockOut.status} />}
          </div>
          <div className="text-2xl font-bold text-slate-900 font-mono">
            {todayClockOut ? formatTime(todayClockOut.timestamp.split("T")[1]) : "--:--:--"}
          </div>
          <p className="text-xs text-slate-500">
            {todayClockOut
              ? `Tercatat pada jarak ${todayClockOut.distance_meters.toFixed(1)}m dari kantor.`
              : "Belum melakukan presensi pulang hari ini."}
          </p>
        </div>
      </div>

      {/* Riwayat Presensi Pribadi */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-sm sm:text-base text-slate-900">
              Riwayat Presensi Saya
            </h2>
            <p className="text-xs text-slate-500">Log kehadiran yang tercatat atas nama Anda</p>
          </div>
          <button
            onClick={loadMyAttendances}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        </div>

        <AttendanceLogTable records={records} isLoading={isLoading} />
      </div>
    </div>
  );
}
