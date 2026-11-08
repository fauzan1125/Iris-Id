"use client";

import React, { useState, useEffect } from "react";
import { MapPin, Clock, Building2, SlidersHorizontal, RefreshCw } from "lucide-react";
import { fetchOffices, fetchShifts, fetchDepartments } from "@/lib/api";
import { OfficeLocation, Shift, Department } from "@/types";
import { formatTime } from "@/lib/utils";

export default function SettingsPage() {
  const [offices, setOffices] = useState<OfficeLocation[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadSettings() {
      try {
        const [o, s, d] = await Promise.all([
          fetchOffices(),
          fetchShifts(),
          fetchDepartments(),
        ]);
        setOffices(o);
        setShifts(s);
        setDepartments(d);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="pb-2 border-b border-slate-200">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          Parameter Lokasi & Kebijakan Jam Kerja
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
          Pengaturan titik validasi radius kantor (Haversine) dan jam kerja reguler.
        </p>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
          <p className="text-sm">Memuat pengaturan sistem...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Office Locations & Geofence Card */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm sm:text-base text-slate-900">
                    Titik Lokasi Kantor & Geofence
                  </h2>
                  <p className="text-xs text-slate-500">Radius lingkaran validasi presensi karyawan</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {offices.map((office) => (
                  <div key={office.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-900">
                        {office.name}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                        Radius: {office.radius_meters} meter
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">{office.address || "Alamat kantor belum diset"}</p>
                    <p className="text-[11px] font-mono text-slate-400">
                      Koordinat: {office.latitude}, {office.longitude}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Work Shifts & Grace Period Card */}
            <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="font-bold text-sm sm:text-base text-slate-900">
                    Kebijakan Shift & Toleransi Jam
                  </h2>
                  <p className="text-xs text-slate-500">Toleransi keterlambatan kehadiran</p>
                </div>
              </div>

              <div className="divide-y divide-slate-100">
                {shifts.map((shift) => (
                  <div key={shift.id} className="py-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-slate-900">
                        {shift.name}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                        Toleransi: +{shift.grace_period_minutes} menit
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-mono">
                      Jam Kerja: {formatTime(shift.start_time)} - {formatTime(shift.end_time)} WIB
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Departments Overview */}
          <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-sm sm:text-base text-slate-900">
                  Daftar Departemen / Unit Kerja
                </h2>
                <p className="text-xs text-slate-500">Struktur unit divisi yang aktif</p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {departments.map((dept) => (
                <div
                  key={dept.id}
                  className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-center"
                >
                  <div className="text-xs font-mono font-bold text-blue-700 mb-0.5">
                    {dept.code}
                  </div>
                  <div className="text-xs font-semibold text-slate-800">
                    {dept.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
