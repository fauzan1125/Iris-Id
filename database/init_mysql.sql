-- ==============================================================
-- Schema MySQL untuk Laragon (Import via HeidiSQL / phpMyAdmin)
-- Database: attendance_db
-- ==============================================================

CREATE DATABASE IF NOT EXISTS `attendance_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `attendance_db`;

-- 1. Departments Table
CREATE TABLE IF NOT EXISTS `departments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `code` VARCHAR(20) NOT NULL UNIQUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Shifts Table
CREATE TABLE IF NOT EXISTS `shifts` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(50) NOT NULL,
    `start_time` TIME NOT NULL,
    `end_time` TIME NOT NULL,
    `grace_period_minutes` INT DEFAULT 15,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Office Locations Table (Geofencing)
CREATE TABLE IF NOT EXISTS `office_locations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `address` TEXT,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `radius_meters` DOUBLE NOT NULL DEFAULT 100.0,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Employees Table
CREATE TABLE IF NOT EXISTS `employees` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `nik` VARCHAR(50) NOT NULL UNIQUE,
    `name` VARCHAR(150) NOT NULL,
    `email` VARCHAR(150) NOT NULL UNIQUE,
    `department_id` INT NULL,
    `shift_id` INT NULL,
    `office_location_id` INT NULL,
    `photo_url` TEXT NULL,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`department_id`) REFERENCES `departments`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`shift_id`) REFERENCES `shifts`(`id`) ON DELETE SET NULL,
    FOREIGN KEY (`office_location_id`) REFERENCES `office_locations`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. Employee Biometrics Table (512-D Vector disimpan dalam JSON / LONGTEXT untuk MySQL)
CREATE TABLE IF NOT EXISTS `employee_biometrics` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL,
    `embedding` JSON NOT NULL,
    `model_name` VARCHAR(100) DEFAULT 'arcface-r50-512',
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. Attendances Table
CREATE TABLE IF NOT EXISTS `attendances` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `employee_id` INT NOT NULL,
    `timestamp` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `attendance_type` VARCHAR(20) NOT NULL,
    `latitude` DOUBLE NOT NULL,
    `longitude` DOUBLE NOT NULL,
    `distance_meters` DOUBLE NOT NULL,
    `status` VARCHAR(30) NOT NULL,
    `similarity_score` DOUBLE NOT NULL,
    `photo_proof_url` TEXT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`employee_id`) REFERENCES `employees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ==============================================================
-- SEED DATA
-- ==============================================================
INSERT IGNORE INTO `departments` (`id`, `name`, `code`) VALUES
(1, 'Engineering & IT', 'ENG'),
(2, 'Human Resources', 'HR'),
(3, 'Marketing & Sales', 'MKT'),
(4, 'Finance & Accounting', 'FIN');

INSERT IGNORE INTO `shifts` (`id`, `name`, `start_time`, `end_time`, `grace_period_minutes`) VALUES
(1, 'Reguler Pagi (Office)', '08:00:00', '17:00:00', 15),
(2, 'Shift Siang', '13:00:00', '21:00:00', 10),
(3, 'Shift Malam', '21:00:00', '06:00:00', 10);

INSERT IGNORE INTO `office_locations` (`id`, `name`, `address`, `latitude`, `longitude`, `radius_meters`) VALUES
(1, 'Kantor Pusat (Jakarta HQ)', 'Jl. M.H. Thamrin No.1, Menteng, Jakarta Pusat', -6.175392, 106.827153, 200.0),
(2, 'Kantor Cabang Bandung', 'Jl. Asia Afrika No. 65, Bandung', -6.921857, 107.607062, 150.0),
(3, 'Testing Lab (Dev Radius Lebar)', 'Development Virtual Hub - Radius Fleksibel', -6.200000, 106.816666, 50000.0);

INSERT IGNORE INTO `employees` (`id`, `nik`, `name`, `email`, `department_id`, `shift_id`, `office_location_id`, `photo_url`, `is_active`) VALUES
(1, 'EMP001', 'Budi Santoso', 'budi.santoso@company.id', 1, 1, 1, '/storage/avatars/emp001.jpg', 1),
(2, 'EMP002', 'Siti Rahmawati', 'siti.rahmawati@company.id', 2, 1, 1, '/storage/avatars/emp002.jpg', 1),
(3, 'EMP003', 'Ahmad Pratama', 'ahmad.pratama@company.id', 1, 1, 3, '/storage/avatars/emp003.jpg', 1);
