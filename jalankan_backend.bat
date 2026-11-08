@echo off
title Backend AI Attendance API (FastAPI)
cd /d "%~dp0backend"

echo ========================================================
echo   Menjalankan Backend AI Attendance API (Laragon Mode)
echo ========================================================

REM Cek apakah Python Laragon tersedia
set PYTHON_CMD=python
if exist "C:\laragon\bin\python\python-3.10\python.exe" (
    set PYTHON_CMD="C:\laragon\bin\python\python-3.10\python.exe"
)

echo Menggunakan Python: %PYTHON_CMD%
echo.

REM Cek dan buat Virtual Environment jika belum ada
if not exist "venv" (
    echo Membuat Virtual Environment...
    %PYTHON_CMD% -m venv venv
)

REM Aktifkan venv
call venv\Scripts\activate.bat

echo Menginstall / Memperbarui dependensi...
pip install -r requirements.txt

echo.
echo ========================================================
echo   Server Aktif di http://localhost:8000
echo   Swagger Docs di http://localhost:8000/api/v1/docs
echo ========================================================
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
pause
