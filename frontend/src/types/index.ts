export interface Department {
  id: number;
  name: string;
  code: string;
}

export interface Shift {
  id: number;
  name: string;
  start_time: string;
  end_time: string;
  grace_period_minutes: number;
}

export interface OfficeLocation {
  id: number;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  radius_meters: number;
}

export interface Employee {
  id: number;
  nik: string;
  name: string;
  email: string;
  department_id?: number;
  shift_id?: number;
  office_location_id?: number;
  photo_url?: string;
  is_active: boolean;
  has_biometric: boolean;
  department?: Department;
  shift?: Shift;
  office_location?: OfficeLocation;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  employee_nik: string;
  employee_name: string;
  department_name?: string;
  timestamp: string;
  attendance_type: 'CLOCK_IN' | 'CLOCK_OUT';
  status: 'ON_TIME' | 'LATE' | 'EARLY_LEAVE' | 'OUT_OF_RANGE';
  distance_meters: number;
  similarity_score: number;
  photo_proof_url?: string;
}

export interface DashboardStats {
  total_employees: number;
  total_present_today: number;
  total_late_today: number;
  total_out_of_range: number;
}

export interface VerifyResult {
  success: boolean;
  message: string;
  employee?: {
    id: number;
    nik: string;
    name: string;
    department?: string;
    photo_url?: string;
  };
  attendance_id?: number;
  attendance_type: string;
  timestamp: string;
  status: 'ON_TIME' | 'LATE' | 'EARLY_LEAVE' | 'OUT_OF_RANGE' | string;
  similarity_score: number;
  distance_meters: number;
  office_name?: string;
  is_within_radius: boolean;
}

export type UserRole = "ADMIN" | "MANAGER" | "EMPLOYEE";

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  employee_id?: number;
  department_id?: number;
  department_name?: string;
  nik?: string;
  is_active: boolean;
}

export interface LoginResponse {
  token: string;
  user: UserProfile;
}
