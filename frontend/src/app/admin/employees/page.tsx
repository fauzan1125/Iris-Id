"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Users, 
  UserPlus, 
  ScanFace, 
  CheckCircle2, 
  XCircle, 
  Camera, 
  Upload, 
  RefreshCw,
  Mail,
  CreditCard,
  Building2,
  Clock,
  MapPin
} from "lucide-react";
import { 
  fetchEmployees, 
  createEmployee, 
  enrollBiometric, 
  fetchDepartments, 
  fetchShifts, 
  fetchOffices 
} from "@/lib/api";
import { Employee, Department, Shift, OfficeLocation } from "@/types";
import { Modal } from "@/components/Modal";

export default function EmployeesAdminPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [offices, setOffices] = useState<OfficeLocation[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Add Employee Modal State
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    nik: "",
    name: "",
    email: "",
    department_id: "",
    shift_id: "",
    office_location_id: "",
  });
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Biometric Enrollment Modal State
  const [enrollTarget, setEnrollTarget] = useState<Employee | null>(null);
  const [enrollMode, setEnrollMode] = useState<"CAMERA" | "UPLOAD">("CAMERA");
  const [enrollCameraError, setEnrollCameraError] = useState<string | null>(null);
  const [enrollSubmitting, setEnrollSubmitting] = useState<boolean>(false);
  const [enrollStatus, setEnrollStatus] = useState<{ success?: boolean; message?: string } | null>(null);
  const enrollVideoRef = useRef<HTMLVideoElement | null>(null);
  const [enrollStream, setEnrollStream] = useState<MediaStream | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [emps, depts, shfs, offs] = await Promise.all([
        fetchEmployees(),
        fetchDepartments(),
        fetchShifts(),
        fetchOffices(),
      ]);
      setEmployees(emps);
      setDepartments(depts);
      setShifts(shfs);
      setOffices(offs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Enrollment Camera setup
  useEffect(() => {
    if (!enrollTarget || enrollMode !== "CAMERA") {
      if (enrollStream) {
        enrollStream.getTracks().forEach((track) => track.stop());
        setEnrollStream(null);
      }
      return;
    }

    let streamObj: MediaStream | null = null;
    async function startEnrollCamera() {
      try {
        setEnrollCameraError(null);
        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, facingMode: "user" },
        });
        streamObj = s;
        setEnrollStream(s);
        if (enrollVideoRef.current) {
          enrollVideoRef.current.srcObject = s;
        }
      } catch (err: any) {
        setEnrollCameraError("Gagal mengakses kamera. Periksa izin akses browser Anda.");
      }
    }

    startEnrollCamera();

    return () => {
      if (streamObj) {
        streamObj.getTracks().forEach((track) => track.stop());
      }
    };
  }, [enrollTarget, enrollMode]);

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setFormError(null);
    try {
      await createEmployee({
        nik: formData.nik,
        name: formData.name,
        email: formData.email,
        department_id: formData.department_id ? Number(formData.department_id) : undefined,
        shift_id: formData.shift_id ? Number(formData.shift_id) : undefined,
        office_location_id: formData.office_location_id ? Number(formData.office_location_id) : undefined,
      });
      setIsAddOpen(false);
      setFormData({
        nik: "",
        name: "",
        email: "",
        department_id: "",
        shift_id: "",
        office_location_id: "",
      });
      loadData();
    } catch (err: any) {
      setFormError(err.message || "Gagal mendaftarkan karyawan.");
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCaptureAndEnroll = async () => {
    if (!enrollTarget || !enrollVideoRef.current) return;
    const video = enrollVideoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL("image/jpeg", 0.95);

    submitEnroll(base64);
  };

  const handleFileUploadAndEnroll = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !enrollTarget) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) submitEnroll(base64);
    };
    reader.readAsDataURL(file);
  };

  const submitEnroll = async (base64: string) => {
    if (!enrollTarget) return;
    setEnrollSubmitting(true);
    setEnrollStatus(null);
    try {
      const res = await enrollBiometric({
        employee_id: enrollTarget.id,
        image_base64: base64,
      });
      setEnrollStatus({ success: true, message: res.message });
      loadData();
    } catch (err: any) {
      setEnrollStatus({ success: false, message: err.message || "Gagal memproses pendaftaran biometrik." });
    } finally {
      setEnrollSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Data Karyawan & Biometrik Wajah
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Daftar karyawan aktif, penugasan shift, kantor kerja, serta status pendaftaran wajah.
          </p>
        </div>
        <button
          onClick={() => setIsAddOpen(true)}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-sm transition min-h-[40px]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Karyawan</span>
        </button>
      </div>

      {/* Employees Table Card */}
      <div className="rounded-xl bg-white border border-slate-200 shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 uppercase text-xs font-semibold tracking-wider">
              <tr>
                <th className="px-4 py-3.5">Karyawan</th>
                <th className="px-4 py-3.5 hidden md:table-cell">Email</th>
                <th className="px-4 py-3.5 hidden sm:table-cell">Departemen</th>
                <th className="px-4 py-3.5">Shift & Penugasan</th>
                <th className="px-4 py-3.5">Status Wajah</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                    Memuat daftar karyawan...
                  </td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                    Belum ada data karyawan yang terdaftar.
                  </td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="font-semibold text-slate-900 leading-tight">{emp.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{emp.nik}</div>
                    </td>
                    <td className="px-4 py-3.5 text-slate-600 hidden md:table-cell text-xs">{emp.email}</td>
                    <td className="px-4 py-3.5 text-slate-600 hidden sm:table-cell text-xs">
                      {emp.department?.name || "-"}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-600">
                      <div className="font-medium text-slate-800">{emp.shift?.name || "Shift Reguler"}</div>
                      <div className="text-slate-500">{emp.office_location?.name || "Kantor Pusat"}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      {emp.has_biometric ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Terdaftar
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <XCircle className="w-3.5 h-3.5 text-amber-600" />
                          Belum Ada
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <button
                        onClick={() => {
                          setEnrollTarget(emp);
                          setEnrollStatus(null);
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                      >
                        <ScanFace className="w-3.5 h-3.5" />
                        <span>{emp.has_biometric ? "Perbarui Wajah" : "Daftarkan Wajah"}</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Tambah Karyawan */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Registrasi Karyawan Baru"
      >
        <form onSubmit={handleCreateEmployee} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium border border-rose-200">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nomor Induk Karyawan (NIK)
            </label>
            <div className="relative">
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="Contoh: EMP004"
                value={formData.nik}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nama Lengkap
            </label>
            <div className="relative">
              <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                required
                placeholder="Nama Lengkap Karyawan"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alamat Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                placeholder="karyawan@perusahaan.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Departemen
              </label>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Pilih Departemen</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Shift Kerja
              </label>
              <select
                value={formData.shift_id}
                onChange={(e) => setFormData({ ...formData, shift_id: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="">Pilih Shift</option>
                {shifts.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Lokasi Kantor
            </label>
            <select
              value={formData.office_location_id}
              onChange={(e) => setFormData({ ...formData, office_location_id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="">Pilih Lokasi Kantor</option>
              {offices.map((o) => (
                <option key={o.id} value={o.id}>{o.name} (Radius {o.radius_meters}m)</option>
              ))}
            </select>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddOpen(false)}
              className="px-4 py-2 rounded-lg text-sm font-semibold text-slate-600 hover:bg-slate-100 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={formSubmitting}
              className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
            >
              {formSubmitting ? "Menyimpan..." : "Simpan Karyawan"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal: Pendaftaran Biometrik Wajah */}
      <Modal
        isOpen={!!enrollTarget}
        onClose={() => {
          setEnrollTarget(null);
          setEnrollStatus(null);
        }}
        title={`Daftarkan Wajah: ${enrollTarget?.name}`}
      >
        <div className="space-y-4">
          {/* Mode Switcher */}
          <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200">
            <button
              type="button"
              onClick={() => setEnrollMode("CAMERA")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition ${
                enrollMode === "CAMERA" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"
              }`}
            >
              <Camera className="w-3.5 h-3.5" /> Kamera Langsung
            </button>
            <button
              type="button"
              onClick={() => setEnrollMode("UPLOAD")}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-md flex items-center justify-center gap-1.5 transition ${
                enrollMode === "UPLOAD" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600"
              }`}
            >
              <Upload className="w-3.5 h-3.5" /> Unggah File Foto
            </button>
          </div>

          {/* Camera Viewfinder */}
          {enrollMode === "CAMERA" ? (
            <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-200">
              {enrollCameraError ? (
                <div className="text-rose-400 text-xs p-4 text-center">{enrollCameraError}</div>
              ) : (
                <>
                  <video
                    ref={enrollVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover transform -scale-x-100"
                  />
                  <div className="absolute inset-0 border-2 border-dashed border-white/60 rounded-full m-8 pointer-events-none" />
                </>
              )}
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center space-y-3 bg-slate-50">
              <Upload className="w-8 h-8 text-slate-400 mx-auto" />
              <div>
                <p className="text-xs text-slate-700 font-medium">
                  Pilih foto wajah karyawan beresolusi jelas (JPG/PNG)
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">Sistem akan mengekstrak vektor biometrik secara otomatis</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUploadAndEnroll}
                className="text-xs text-slate-600 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 cursor-pointer"
              />
            </div>
          )}

          {/* Action Button for Camera */}
          {enrollMode === "CAMERA" && (
            <button
              type="button"
              onClick={handleCaptureAndEnroll}
              disabled={enrollSubmitting}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {enrollSubmitting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Mengekstrak Fitur Wajah...
                </>
              ) : (
                <>
                  <ScanFace className="w-4 h-4" />
                  Ambil Foto & Simpan Biometrik
                </>
              )}
            </button>
          )}

          {/* Status Feedback */}
          {enrollStatus && (
            <div
              className={`p-3 rounded-lg text-xs font-semibold flex items-center gap-2 ${
                enrollStatus.success
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {enrollStatus.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <XCircle className="w-4 h-4 shrink-0 text-rose-600" />}
              <span>{enrollStatus.message}</span>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}
