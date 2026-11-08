"use client";

import React, { useState } from "react";
import { AttendanceRecord } from "@/types";
import { StatusBadge } from "./StatusBadge";
import { formatDateTime } from "@/lib/utils";
import { Eye } from "lucide-react";
import { Modal } from "./Modal";

interface AttendanceLogTableProps {
  records: AttendanceRecord[];
  isLoading?: boolean;
}

export function AttendanceLogTable({ records, isLoading }: AttendanceLogTableProps) {
  const [selectedProof, setSelectedProof] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="w-full p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium">Memuat catatan riwayat presensi...</p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="w-full p-12 text-center text-slate-500 bg-white rounded-xl border border-slate-200">
        <p className="text-sm">Tidak ditemukan data presensi untuk kriteria ini.</p>
      </div>
    );
  }

  return (
    <>
      <div className="w-full overflow-x-auto bg-white rounded-xl border border-slate-200 shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 text-xs font-semibold uppercase tracking-wider">
            <tr>
              <th className="px-4 py-3.5">Karyawan</th>
              <th className="px-4 py-3.5 hidden sm:table-cell">Departemen</th>
              <th className="px-4 py-3.5">Waktu</th>
              <th className="px-4 py-3.5">Tipe</th>
              <th className="px-4 py-3.5">Status</th>
              <th className="px-4 py-3.5 hidden md:table-cell">Jarak Kantor</th>
              <th className="px-4 py-3.5 text-right">Foto Bukti</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {records.map((item) => (
              <tr 
                key={item.id} 
                className="hover:bg-slate-50/80 transition-colors"
              >
                <td className="px-4 py-3.5">
                  <div className="font-semibold text-slate-900 leading-tight">
                    {item.employee_name}
                  </div>
                  <div className="text-xs text-slate-500 font-mono">
                    {item.employee_nik}
                  </div>
                </td>
                <td className="px-4 py-3.5 text-slate-600 hidden sm:table-cell text-xs">
                  {item.department_name || "-"}
                </td>
                <td className="px-4 py-3.5 text-slate-700 whitespace-nowrap text-xs">
                  {formatDateTime(item.timestamp)}
                </td>
                <td className="px-4 py-3.5">
                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold ${
                    item.attendance_type === "CLOCK_IN" 
                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                      : "bg-slate-100 text-slate-700 border border-slate-200"
                  }`}>
                    {item.attendance_type === "CLOCK_IN" ? "Masuk" : "Pulang"}
                  </span>
                </td>
                <td className="px-4 py-3.5">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-4 py-3.5 text-xs font-mono text-slate-600 hidden md:table-cell">
                  {item.distance_meters.toFixed(1)} m
                </td>
                <td className="px-4 py-3.5 text-right">
                  {item.photo_proof_url ? (
                    <button
                      onClick={() => setSelectedProof(item.photo_proof_url || null)}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-600" />
                      <span>Foto</span>
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal View Foto Bukti */}
      <Modal
        isOpen={!!selectedProof}
        onClose={() => setSelectedProof(null)}
        title="Foto Bukti Verifikasi Presensi"
      >
        <div className="flex flex-col items-center justify-center p-2">
          {selectedProof && (
            <img
              src={`http://localhost:8000${selectedProof}`}
              alt="Foto Bukti Presensi"
              className="max-h-[70vh] w-auto rounded-lg border border-slate-200 object-contain shadow-sm"
              onError={(e) => {
                // Fallback direct url if relative path handled differently
                (e.target as HTMLImageElement).src = selectedProof;
              }}
            />
          )}
          <p className="mt-3 text-xs text-slate-500">
            Foto otomatis diambil pada saat karyawan melakukan verifikasi wajah.
          </p>
        </div>
      </Modal>
    </>
  );
}
