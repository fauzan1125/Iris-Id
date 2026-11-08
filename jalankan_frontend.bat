@echo off
title Frontend Next.js Attendance App
cd /d "%~dp0frontend"

echo ========================================================
echo   Menjalankan Frontend Web Presensi (Next.js)
echo ========================================================

REM Cek apakah node_modules sudah ada
if not exist "node_modules" (
    echo Menginstall paket frontend (npm install)...
    call npm.cmd install
)

REM Build jika folder .next belum ada
if not exist ".next" (
    echo Membangun aplikasi produksi Next.js...
    call npm.cmd run build
)

echo.
echo ========================================================
echo   Aplikasi Web Aktif di: http://localhost:3000
echo ========================================================
call npm.cmd run start
pause
