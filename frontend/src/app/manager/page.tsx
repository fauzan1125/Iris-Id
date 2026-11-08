"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { fetchAttendances, fetchDashboardStats } from "@/lib/api";
import { AttendanceRecord, DashboardStats } from "@/types";
import { AttendanceLogTable } from "@/components/AttendanceLogTable";
import { 
  Briefcase, 
  Users, 
  CheckCircle2, 
  Clock, 
  MapPinOff, 
  RefreshCw, 
  Calendar,
  ShieldAlert,
  ArrowRight
} from "lucide-react";

export default function ManagerDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    total_employees: 0,
    total_present_today: 0,
    total_late_today: 0,
    total_out_of_range: 0,
  });
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadTeamData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [statsData, attendancesData] = await Promise.all([
        fetchDashboardStats(user.department_id),
        fetchAttendances({
          date: selectedDate || undefined,
          department_id: user.department_id,
        }),
      ]);
      setStats(statsData);
      setRecords(attendancesData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadTeamData();
    }
  }, [user, selectedDate]);

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center text-slate-500">
        <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-2 text-amber-600" />
        <p className="text-sm">Memuat dashboard manager...</p>
      </div>
    );
  }

  if (!user || (user.role !== "MANAGER" && user.role !== "ADMIN")) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-4">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <ShieldAlert className="w-10 h-10 text-amber-600 mx-auto" />
          <h2 className="font-bold text-lg text-slate-900">Akses Dibatasi</h2>
          <p className="text-xs text-slate-500">
            Halaman ini khusus untuk peran Manager atau Administrator. Silakan login dengan akun yang sesuai.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm transition"
          >
            <span>Buka Halaman Login</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
              Monitoring Kehadiran Tim Departemen
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              Manager Portal
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Departemen: <strong>{user.department_name || "Seluruh Divisi"}</strong> • Dipantau oleh {user.name}
          </p>
        </div>
        <button
          onClick={loadTeamData}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition min-h-[40px]"
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? "animate-spin" : ""}`} />
          <span>Perbarui Data Tim</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Anggota Tim */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Anggota Tim
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1 block">
              {stats.total_employees}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Hadir Hari Ini */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Hadir Hari Ini
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-1 block">
              {stats.total_present_today}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Terlambat */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Terlambat
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-amber-700 mt-1 block">
              {stats.total_late_today}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Luar Radius */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Luar Radius
            </span>
            <span className="text-2xl sm:text-3xl font-bold text-rose-700 mt-1 block">
              {stats.total_out_of_range}
            </span>
          </div>
          <div className="w-10 h-10 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center">
            <MapPinOff className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter by Date */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 max-w-xs flex-1">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 min-h-[36px]"
          />
        </div>
        {selectedDate && (
          <button
            onClick={() => setSelectedDate("")}
            className="text-xs font-semibold text-amber-600 hover:text-amber-800"
          >
            Reset Tanggal
          </button>
        )}
      </div>

      {/* Log Presensi Tim */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm sm:text-base text-slate-900">
            Riwayat Presensi Anggota Tim
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {records.length} catatan ditemukan
          </span>
        </div>
        <AttendanceLogTable records={records} isLoading={isLoading} />
      </div>
    </div>
  );
}
