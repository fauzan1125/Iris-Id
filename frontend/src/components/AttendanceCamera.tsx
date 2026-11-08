"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Camera, 
  MapPin, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  LogIn,
  LogOut,
  SwitchCamera,
  UploadCloud,
  Smartphone
} from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLivenessDetection } from "@/hooks/useLivenessDetection";
import { verifyAttendance } from "@/lib/api";
import { VerifyResult } from "@/types";
import { StatusBadge } from "./StatusBadge";

export function AttendanceCamera() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInsecureContext, setIsInsecureContext] = useState<boolean>(false);
  const [attendanceType, setAttendanceType] = useState<"CLOCK_IN" | "CLOCK_OUT">("CLOCK_IN");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verifyResult, setVerifyResult] = useState<VerifyResult | null>(null);
  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const { latitude, longitude, accuracy, error: gpsError, loading: gpsLoading, isSimulated, refreshLocation } = useGeolocation();
  const { step, instruction, progress, isLive, resetLiveness } = useLivenessDetection(videoRef);

  // Check if browser context is secure for getUserMedia
  useEffect(() => {
    if (typeof window !== "undefined") {
      const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
      const isHttps = window.location.protocol === "https:";
      const hasMediaDevices = !!navigator?.mediaDevices?.getUserMedia;
      
      if (!isLocal && !isHttps && !hasMediaDevices) {
        setIsInsecureContext(true);
      }
    }
  }, []);

  // Initialize or restart camera
  const startCamera = useCallback(async (mode: "user" | "environment") => {
    // If user already captured a photo via native camera, don't restart stream
    if (capturedPhoto) return;

    // Stop any existing tracks
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    try {
      setCameraError(null);
      if (!navigator?.mediaDevices?.getUserMedia) {
        setIsInsecureContext(true);
        setCameraError("Kamera streaming WebRTC memerlukan koneksi HTTPS saat dibuka di HP.");
        return;
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: mode,
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      setCameraError("Izin kamera belum aktif di browser. Izinkan akses kamera atau gunakan tombol Kamera HP.");
    }
  }, [stream, capturedPhoto]);

  useEffect(() => {
    startCamera(facingMode);
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [facingMode]);

  const toggleCameraFacing = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
  };

  // Handle native mobile phone camera capture (Works on HTTP without WebRTC restrictions!)
  const handleNativeCameraInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      if (base64) {
        setCapturedPhoto(base64);
        setCameraError(null);
        setFeedbackError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRetakePhoto = () => {
    setCapturedPhoto(null);
    setVerifyResult(null);
    startCamera(facingMode);
  };

  // Capture video frame to Base64
  const captureFrame = (): string | null => {
    if (capturedPhoto) {
      return capturedPhoto;
    }

    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.9);
  };

  const handleVerify = async () => {
    const finalLat = latitude ?? -6.175392;
    const finalLon = longitude ?? 106.827153;

    const frameBase64 = captureFrame();
    if (!frameBase64) {
      setFeedbackError("Belum ada foto yang siap. Ambil foto terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    setFeedbackError(null);
    setVerifyResult(null);

    try {
      const result = await verifyAttendance({
        image_base64: frameBase64,
        latitude: finalLat,
        longitude: finalLon,
        attendance_type: attendanceType,
      });
      setVerifyResult(result);
    } catch (err: any) {
      setFeedbackError(err.message || "Proses verifikasi presensi tidak berhasil.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Attendance Mode Selector (Clock In vs Clock Out) */}
      <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
        <button
          type="button"
          onClick={() => setAttendanceType("CLOCK_IN")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all min-h-[44px] ${
            attendanceType === "CLOCK_IN"
              ? "bg-blue-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <LogIn className="w-4 h-4" />
          <span>Presensi Masuk</span>
        </button>
        <button
          type="button"
          onClick={() => setAttendanceType("CLOCK_OUT")}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-semibold text-xs sm:text-sm transition-all min-h-[44px] ${
            attendanceType === "CLOCK_OUT"
              ? "bg-slate-800 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <LogOut className="w-4 h-4" />
          <span>Presensi Pulang</span>
        </button>
      </div>

      {/* Hidden Native File/Camera Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        onChange={handleNativeCameraInput}
        className="hidden"
        id="phone-camera-input"
      />

      {/* Camera Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-sm space-y-3">
        {/* Status Header: GPS & Camera Switch */}
        <div className="flex items-center justify-between gap-2 text-xs">
          {/* GPS Info */}
          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 flex-1 min-w-0">
            <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            {gpsLoading ? (
              <span className="truncate flex items-center gap-1 text-slate-500">
                <RefreshCw className="w-3 h-3 animate-spin shrink-0" /> Mendeteksi GPS...
              </span>
            ) : isSimulated ? (
              <span className="text-slate-600 truncate font-mono text-[11px]" title="GPS dibatasi oleh browser non-HTTPS. Menggunakan koordinat kantor.">
                Kantor: {latitude?.toFixed(4)}, {longitude?.toFixed(4)} (Simulasi)
              </span>
            ) : (
              <span className="font-mono truncate text-emerald-700 font-medium text-[11px]">
                GPS: {latitude?.toFixed(4)}, {longitude?.toFixed(4)} (±{Math.round(accuracy || 0)}m)
              </span>
            )}
            <button
              onClick={refreshLocation}
              title="Perbarui koordinat GPS"
              className="ml-auto text-slate-400 hover:text-slate-700 p-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Camera Flip Button (Only shown when live stream is active) */}
          {!capturedPhoto && !isInsecureContext && (
            <button
              type="button"
              onClick={toggleCameraFacing}
              title="Ganti Kamera Depan/Belakang"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 min-h-[36px] font-medium"
            >
              <SwitchCamera className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Ganti Kamera</span>
            </button>
          )}
        </div>

        {/* Viewfinder Frame */}
        <div className="relative aspect-[3/4] sm:aspect-[4/3] w-full max-w-md mx-auto rounded-xl overflow-hidden bg-slate-950 flex items-center justify-center border border-slate-200">
          {capturedPhoto ? (
            /* Display captured photo from native camera */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              <img
                src={capturedPhoto}
                alt="Foto Wajah Presensi"
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3">
                <button
                  type="button"
                  onClick={handleRetakePhoto}
                  className="px-3 py-1.5 rounded-lg bg-black/70 hover:bg-black text-white text-xs font-semibold backdrop-blur-sm border border-white/20 transition"
                >
                  Ambil Ulang
                </button>
              </div>
              <div className="absolute bottom-3 inset-x-3 bg-emerald-950/80 border border-emerald-500/50 text-emerald-200 text-xs px-3 py-1.5 rounded-lg text-center backdrop-blur-sm">
                Foto berhasil diambil dari kamera ponsel. Siap dicatat.
              </div>
            </div>
          ) : cameraError || isInsecureContext ? (
            /* Friendly HTTP / Insecure Context / Camera Fallback Screen */
            <div className="text-center p-6 space-y-4 text-white max-w-xs mx-auto">
              <div className="w-12 h-12 rounded-full bg-blue-900/60 border border-blue-500/30 flex items-center justify-center mx-auto text-blue-400">
                <Smartphone className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-sm">Gunakan Kamera Ponsel</p>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Browser ponsel membatasi video langsung pada koneksi HTTP lokal. Ketuk tombol di bawah untuk membuka kamera bawaan ponsel Anda:
                </p>
              </div>
              <label
                htmlFor="phone-camera-input"
                className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm cursor-pointer shadow-md transition"
              >
                <Camera className="w-4 h-4" />
                <span>Buka Kamera Ponsel</span>
              </label>
            </div>
          ) : (
            /* Live WebRTC Stream */
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${
                  facingMode === "user" ? "transform -scale-x-100" : ""
                }`}
              />

              {/* Clean Face Guide Oval */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center p-6">
                <div
                  className={`w-48 h-64 sm:w-56 sm:h-72 rounded-[45%] border-2 transition-colors duration-200 ${
                    isLive 
                      ? "border-emerald-400 bg-emerald-500/10 shadow-sm" 
                      : "border-dashed border-white/60"
                  }`}
                />
              </div>

              {/* Live Instruction Pill */}
              <div className="absolute bottom-3 left-3 right-3 flex flex-col items-center gap-1.5">
                <div className="bg-slate-900/80 backdrop-blur-sm border border-slate-700/60 px-3 py-1.5 rounded-full flex items-center gap-2 text-xs text-white max-w-[90%] truncate shadow-sm">
                  {isLive ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <div className="w-2 h-2 rounded-full bg-blue-400 shrink-0 animate-ping" />
                  )}
                  <span className="truncate">{instruction}</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Action Button */}
        <div className="space-y-2 pt-1">
          {capturedPhoto ? (
            /* Action Button when Photo is captured */
            <button
              type="button"
              onClick={handleVerify}
              disabled={isSubmitting}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all min-h-[48px] ${
                isSubmitting
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : attendanceType === "CLOCK_IN"
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-[0.99]"
                  : "bg-slate-800 hover:bg-slate-900 text-white shadow-sm active:scale-[0.99]"
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Memvalidasi Wajah & Lokasi...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {attendanceType === "CLOCK_IN"
                      ? "Kirim Presensi Masuk"
                      : "Kirim Presensi Pulang"}
                  </span>
                </>
              )}
            </button>
          ) : isInsecureContext || cameraError ? (
            /* Direct open phone camera button */
            <label
              htmlFor="phone-camera-input"
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all min-h-[48px] cursor-pointer ${
                attendanceType === "CLOCK_IN"
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-[0.99]"
                  : "bg-slate-800 hover:bg-slate-900 text-white shadow-sm active:scale-[0.99]"
              }`}
            >
              <Camera className="w-5 h-5" />
              <span>Ambil Foto dengan Kamera HP</span>
            </label>
          ) : (
            /* Live WebRTC capture button */
            <button
              type="button"
              onClick={handleVerify}
              disabled={isSubmitting || !!cameraError}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm sm:text-base flex items-center justify-center gap-2 transition-all min-h-[48px] ${
                isSubmitting || !!cameraError
                  ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                  : attendanceType === "CLOCK_IN"
                  ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:scale-[0.99]"
                  : "bg-slate-800 hover:bg-slate-900 text-white shadow-sm active:scale-[0.99]"
              }`}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Memvalidasi Presensi...</span>
                </>
              ) : (
                <>
                  <Camera className="w-5 h-5" />
                  <span>
                    {attendanceType === "CLOCK_IN"
                      ? "Ambil Foto Presensi Masuk"
                      : "Ambil Foto Presensi Pulang"}
                  </span>
                </>
              )}
            </button>
          )}

          <div className="flex justify-between items-center text-xs text-slate-500 px-1">
            <span>Verifikasi biometrik & geofence aktif</span>
            {!capturedPhoto && !isInsecureContext && (
              <button
                type="button"
                onClick={resetLiveness}
                className="text-blue-600 hover:underline font-medium py-1"
              >
                Reset Sensor
              </button>
            )}
          </div>
        </div>

        {/* Feedback Error Message */}
        {feedbackError && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs sm:text-sm">
            <XCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Presensi Gagal</p>
              <p className="text-rose-700 mt-0.5">{feedbackError}</p>
            </div>
          </div>
        )}

        {/* Attendance Result Card */}
        {verifyResult && (
          <div
            className={`p-4 sm:p-5 rounded-xl border ${
              verifyResult.success
                ? "bg-emerald-50/60 border-emerald-300 text-emerald-950"
                : "bg-amber-50/60 border-amber-300 text-amber-950"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    verifyResult.success ? "bg-emerald-600 text-white" : "bg-amber-600 text-white"
                  }`}
                >
                  {verifyResult.success ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base leading-tight">
                    {verifyResult.message}
                  </h3>
                  {verifyResult.employee && (
                    <p className="text-xs sm:text-sm text-slate-700 font-medium mt-0.5">
                      {verifyResult.employee.name} ({verifyResult.employee.nik}) • {verifyResult.employee.department}
                    </p>
                  )}
                </div>
              </div>
              <StatusBadge status={verifyResult.status} />
            </div>

            {/* Metrics Breakdown */}
            <div className="mt-3 pt-3 border-t border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Jarak ke Kantor</span>
                <span className="font-mono font-bold text-slate-800">
                  {verifyResult.distance_meters.toFixed(1)} meter
                </span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                <span className="text-slate-500 block">Status Area</span>
                <span className={`font-semibold ${verifyResult.is_within_radius ? "text-emerald-700" : "text-rose-700"}`}>
                  {verifyResult.is_within_radius ? "Dalam Radius Kantor" : "Luar Radius Kantor"}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
