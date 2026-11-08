"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { 
  Users, 
  CheckCircle2, 
  Clock, 
  MapPinOff, 
  RefreshCw,
  Calendar,
  Building2,
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { fetchAttendances, fetchDashboardStats, fetchDepartments } from "@/lib/api";
import { AttendanceRecord, DashboardStats, Department } from "@/types";
import { AttendanceLogTable } from "@/components/AttendanceLogTable";

export default function AdminDashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    total_employees: 0,
    total_present_today: 0,
    total_late_today: 0,
    total_out_of_range: 0,
  });
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedDept, setSelectedDept] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [statsData, deptsData, attendancesData] = await Promise.all([
        fetchDashboardStats(),
        fetchDepartments(),
        fetchAttendances({
          date: selectedDate || undefined,
          department_id: selectedDept ? Number(selectedDept) : undefined,
        }),
      ]);
      setStats(statsData);
      setDepartments(deptsData);
      setRecords(attendancesData);
    } catch (err) {
      console.error("Error loading dashboard data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate, selectedDept]);

  if (!authLoading && user && user.role === "EMPLOYEE") {
    return (
      <div className="max-w-md mx-auto px-4 py-12 text-center space-y-4">
        <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="font-bold text-lg text-slate-900">Akses Ditolak</h2>
          <p className="text-xs text-slate-500">
            Akun karyawan tidak memiliki hak akses ke panel Administrator HR. Silakan akses dashboard pribadi Anda.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm transition"
          >
            <span>Buka Dashboard Karyawan</span>
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Monitoring Presensi Karyawan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Ringkasan status kehadiran harian, verifikasi geofence, dan log bukti biometrik.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg bg-white border border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition min-h-[40px]"
        >
          <RefreshCw className={`w-4 h-4 text-slate-500 ${isLoading ? "animate-spin" : ""}`} />
          <span>Perbarui Data</span>
        </button>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Karyawan */}
        <div className="p-4 sm:p-5 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Karyawan
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

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 flex-1">
          {/* Tanggal */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Calendar className="w-4 h-4" />
            </div>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent min-h-[40px]"
            />
          </div>

          {/* Departemen */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Building2 className="w-4 h-4" />
            </div>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent min-h-[40px]"
            >
              <option value="">Semua Departemen</option>
              {departments.map((dept) => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>
        </div>

        {(selectedDate || selectedDept) && (
          <button
            onClick={() => {
              setSelectedDate("");
              setSelectedDept("");
            }}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 self-center py-1 px-2"
          >
            Reset Filter
          </button>
        )}
      </div>

      {/* Log Presensi Table */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm sm:text-base text-slate-900">
            Riwayat Presensi Terbaru
          </h2>
          <span className="text-xs text-slate-500 font-mono">
            {records.length} data ditemukan
          </span>
        </div>
        <AttendanceLogTable records={records} isLoading={isLoading} />
      </div>
    </div>
  );
}
