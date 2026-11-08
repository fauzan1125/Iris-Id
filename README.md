# 🌟 Smart Web Biometric Attendance System

Sistem Presensi Cerdas berbasis biometrik wajah (512-D Vector Embedding via PostgreSQL `pgvector`), deteksi Anti-Spoofing Liveness (MediaPipe FaceMesh), dan validasi geofencing lokasi kantor (Formula Haversine).

---

## 🏗️ Arsitektur Teknologi

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend** | Next.js 14 (App Router), Tailwind CSS, Lucide Icons | Kamera WebRTC, Liveness Micro-motion Check, Geolocation API |
| **Backend API** | FastAPI (Python 3.11), SQLAlchemy ORM | Ekstraksi Biometrik 512-D, Validasi Haversine, RESTful Endpoints |
| **Face AI Engine** | ONNX Runtime / ArcFace (InsightFace architecture) | Output 512-dimensi L2 Normalized Vector |
| **Database** | PostgreSQL 16 + Ekstensi `pgvector` | HNSW Indexing untuk Cosine Distance (`<=>`) matching |
| **Container** | Docker & Docker Compose | Multi-container stack (Database, AI Service, Web App) |

---

## 📁 Struktur Direktori

```text
web_absensi_wajah/
├── docker-compose.yml              # Konfigurasi container stack lengkap
├── .env.example                    # Template konfigurasi environment
├── README.md                       # Dokumentasi dan panduan instalasi
├── database/
│   └── init.sql                    # DDL Schema, Index pgvector HNSW, & Dummy Seed
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt            # Dependensi FastAPI, ONNX, pgvector, OpenCV
│   └── app/
│       ├── main.py                 # FastAPI App & Router Mounts
│       ├── config.py               # Pydantic Settings
│       ├── database.py             # SQLAlchemy Engine & Session
│       ├── models.py               # Database Models (pgvector Vector(512))
│       ├── schemas.py              # Pydantic Schema Validation
│       ├── services/
│       │   ├── face_engine.py      # Ekstraksi 512-D Vector & Normalisasi L2
│       │   ├── geolocation.py      # Formula Haversine Geofencing
│       │   └── attendance.py       # Nearest Neighbor Query & Validasi Shift
│       └── routers/
│           ├── biometrics.py       # POST /api/v1/enroll & POST /api/v1/verify
│           ├── attendances.py      # GET /api/v1/attendances & Stats
│           ├── employees.py        # CRUD Karyawan
│           └── master_data.py      # Kantor, Shift, & Departemen
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── next.config.mjs
    ├── tailwind.config.ts
    └── src/
        ├── app/
        │   ├── page.tsx            # Viewfinder Kamera Presensi & Liveness
        │   ├── admin/page.tsx      # Dashboard HR & Monitoring Log
        │   ├── admin/employees/    # Registrasi Karyawan & Biometrik Wajah
        │   └── admin/settings/     # Konfigurasi Geofence & Shift
        ├── components/
        │   ├── AttendanceCamera.tsx# WebRTC Viewfinder + Holographic Scan
        │   ├── AttendanceLogTable.tsx # Tabel Riwayat + Foto Bukti Modal
        │   ├── Navbar.tsx          # Navigasi & Live Clock
        │   ├── StatusBadge.tsx     # Badge ON_TIME, LATE, OUT_OF_RANGE
        │   └── Modal.tsx           # Reusable Dialog
        └── hooks/
            ├── useGeolocation.ts   # High-Accuracy GPS Sensor
            └── useLivenessDetection.ts # Anti-Spoofing Blink & Motion Detector
```

---

## ⚡ Panduan Menjalankan Aplikasi

### Opsi 1: Menggunakan Docker Compose (Direkomendasikan)

1. **Salin file environment:**
   ```bash
   cp .env.example .env
   ```

2. **Jalankan semua service sekaligus:**
   ```bash
   docker compose up -d --build
   ```

3. **Akses aplikasi di browser:**
   - **Frontend Presensi & Dashboard:** [http://localhost:3000](http://localhost:3000)
   - **Backend API & Swagger Docs:** [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)
   - **PostgreSQL pgvector:** `localhost:5432` (User: `postgres`, Pass: `postgres`, DB: `attendance_db`)

---

### Opsi 2: Menjalankan Secara Manual (Development Lokal)

#### 1. Jalankan PostgreSQL dengan `pgvector`
```bash
docker run -d --name pgvector-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=attendance_db -p 5432:5432 pgvector/pgvector:pg16
```
Jalankan script schema database:
```bash
# Masukkan schema dan seed awal
psql -h localhost -U postgres -d attendance_db -f database/init.sql
```

#### 2. Menjalankan Backend (FastAPI)
```bash
cd backend
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Swagger UI otomatis aktif di: [http://localhost:8000/api/v1/docs](http://localhost:8000/api/v1/docs)

#### 3. Menjalankan Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Akses UI di: [http://localhost:3000](http://localhost:3000)

---

## 🔬 Penjelasan Teknis Modul Inti

### 1. Vector Search Biometrik 512-D (`pgvector`)
Model menghasilkan 512-D float array yang di-normalisasi $L_2$. Di PostgreSQL, pencarian kemiripan terdekat dihitung menggunakan Cosine Distance (`<=>`):
$$\text{Cosine Distance} = 1 - \frac{\vec{u} \cdot \vec{v}}{\|\vec{u}\|_2 \|\vec{v}\|_2}$$
Query SQL:
```sql
SELECT employee_id, (embedding <=> :query_vector) AS distance
FROM employee_biometrics
ORDER BY distance ASC
LIMIT 1;
```
Batas ambang: Jarak $\le 0.35$ (setara kemiripan wajah $\ge 65\%$).

### 2. Validasi Geofencing (Formula Haversine)
Menghitung jarak lengkung bumi presisi tinggi antara koordinat perangkat $(lat_1, lon_1)$ dan titik pusat kantor $(lat_2, lon_2)$:
$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
$$d = 2 \cdot R \cdot \text{atan2}(\sqrt{a}, \sqrt{1-a})$$
Presensi hanya berstatus valid jika $d \le \text{radius\_meters}$. Jika di luar radius, presensi otomatis ditandai `OUT_OF_RANGE`.

### 3. Deteksi Anti-Spoofing Liveness
Kamera memantau kehadiran wajah dan perubahan mikro antar frame (kedipan mata, pergerakan sudut kepala) untuk membedakan antara wajah manusia hidup secara real-time dengan foto statis / layar HP cetak.

---

## 🧪 Akun Karyawan Bawaan (Seed Data)
Sistem dilengkapi akun dummy siap uji di [database/init.sql](database/init.sql):
- **Budi Santoso** (`EMP001`) - Engineering (Shift Reguler)
- **Siti Rahmawati** (`EMP002`) - HR (Shift Reguler)
- **Ahmad Pratama** (`EMP003`) - Engineering (Dev Lab - Radius Lebar)

Anda dapat langsung menuju menu **Karyawan & Biometrik** di dashboard untuk mendaftarkan wajah Anda ke salah satu akun tersebut!
