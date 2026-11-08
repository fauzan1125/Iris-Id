import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/Navbar";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#ffffff",
};

export const metadata: Metadata = {
  title: "IRIS ID - Sistem Presensi Biometrik & Validasi Lokasi",
  description: "IRIS ID: Sistem pencatatan presensi kehadiran karyawan terverifikasi biometrik wajah dan geofencing lokasi kerja.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
        <AuthProvider>
          <Navbar />
          <main className="flex-1 pb-24 md:pb-12">{children}</main>
          <footer className="border-t border-slate-200 bg-white py-6 text-center text-xs text-slate-500 hidden md:block">
            IRIS ID &copy; {new Date().getFullYear()} • Smart Biometric Attendance System
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
