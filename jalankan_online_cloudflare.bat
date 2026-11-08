@echo off
title Online Cloudflare Tunnel (IRIS ID)
cd /d "%~dp0"

echo ========================================================
echo   Membuka Akses Online Publik HTTPS (Cloudflare Tunnel)
echo   Website IRIS ID akan bisa diakses dari HP / Luar Jaringan
echo ========================================================
echo.
echo Menghubungkan ke Cloudflare Edge...
echo Tautan HTTPS resmi akan muncul di bawah (https://....trycloudflare.com)
echo.
call npx.cmd --yes cloudflared tunnel --url http://localhost:3000
pause
