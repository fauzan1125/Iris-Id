-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Shifts Table
CREATE TABLE IF NOT EXISTS shifts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    grace_period_minutes INT DEFAULT 15,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Office Locations Table (Geofencing)
CREATE TABLE IF NOT EXISTS office_locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    address TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    radius_meters DOUBLE PRECISION NOT NULL DEFAULT 100.0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Employees Table
CREATE TABLE IF NOT EXISTS employees (
    id SERIAL PRIMARY KEY,
    nik VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(150) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    department_id INT REFERENCES departments(id) ON DELETE SET NULL,
    shift_id INT REFERENCES shifts(id) ON DELETE SET NULL,
    office_location_id INT REFERENCES office_locations(id) ON DELETE SET NULL,
    photo_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Employee Biometrics (512-Dimensional Vector for ArcFace / InsightFace)
CREATE TABLE IF NOT EXISTS employee_biometrics (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    embedding vector(512) NOT NULL,
    model_name VARCHAR(100) DEFAULT 'arcface-r50-512',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Vector similarity index using HNSW for ultra-fast Cosine distance matching
CREATE INDEX IF NOT EXISTS idx_employee_biometrics_hnsw 
ON employee_biometrics 
USING hnsw (embedding vector_cosine_ops);

-- 6. Attendances Table
CREATE TABLE IF NOT EXISTS attendances (
    id SERIAL PRIMARY KEY,
    employee_id INT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    attendance_type VARCHAR(20) NOT NULL, -- CLOCK_IN, CLOCK_OUT
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    distance_meters DOUBLE PRECISION NOT NULL,
    status VARCHAR(30) NOT NULL, -- ON_TIME, LATE, EARLY_LEAVE, OUT_OF_RANGE
    similarity_score DOUBLE PRECISION NOT NULL,
    photo_proof_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendances_employee_date 
ON attendances (employee_id, timestamp);

-- ==========================================
-- SEED DATA
-- ==========================================
INSERT INTO departments (name, code) VALUES
('Engineering & IT', 'ENG'),
('Human Resources', 'HR'),
('Marketing & Sales', 'MKT'),
('Finance & Accounting', 'FIN')
ON CONFLICT (code) DO NOTHING;

INSERT INTO shifts (name, start_time, end_time, grace_period_minutes) VALUES
('Reguler Pagi (Office)', '08:00:00', '17:00:00', 15),
('Shift Siang', '13:00:00', '21:00:00', 10),
('Shift Malam', '21:00:00', '06:00:00', 10)
ON CONFLICT DO NOTHING;

-- Default Office Location (Contoh: Menara Thamrin / Monas Jakarta & Flexibel)
INSERT INTO office_locations (name, address, latitude, longitude, radius_meters) VALUES
('Kantor Pusat (Jakarta HQ)', 'Jl. M.H. Thamrin No.1, Menteng, Jakarta Pusat', -6.175392, 106.827153, 200.0),
('Kantor Cabang Bandung', 'Jl. Asia Afrika No. 65, Bandung', -6.921857, 107.607062, 150.0),
('Testing Lab (Dev Radius Lebar)', 'Development Virtual Hub - Radius Fleksibel', -6.200000, 106.816666, 50000.0)
ON CONFLICT DO NOTHING;

INSERT INTO employees (nik, name, email, department_id, shift_id, office_location_id, photo_url, is_active) VALUES
('EMP001', 'Budi Santoso', 'budi.santoso@company.id', 1, 1, 1, '/storage/avatars/emp001.jpg', true),
('EMP002', 'Siti Rahmawati', 'siti.rahmawati@company.id', 2, 1, 1, '/storage/avatars/emp002.jpg', true),
('EMP003', 'Ahmad Pratama', 'ahmad.pratama@company.id', 1, 1, 3, '/storage/avatars/emp003.jpg', true)
ON CONFLICT (nik) DO NOTHING;
