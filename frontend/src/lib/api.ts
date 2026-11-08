import { 
  AttendanceRecord, 
  DashboardStats, 
  Employee, 
  Department, 
  Shift, 
  OfficeLocation, 
  VerifyResult,
  UserProfile,
  LoginResponse
} from "@/types";

// In browser client, use relative URL ("") so Next.js rewrites proxy to backend
// In SSR or node context, use NEXT_PUBLIC_API_URL or fallback to http://localhost:8000
const BASE_URL = typeof window !== "undefined" ? "" : (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000");

export async function loginUser(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Login gagal. Periksa email dan password.");
  }
  return res.json();
}

export async function fetchCurrentUser(token: string): Promise<UserProfile> {
  const res = await fetch(`${BASE_URL}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error("Gagal memuat profil pengguna.");
  return res.json();
}

export async function verifyAttendance(payload: {
  image_base64: string;
  latitude: number;
  longitude: number;
  attendance_type: string;
}): Promise<VerifyResult> {
  const res = await fetch(`${BASE_URL}/api/v1/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Gagal melakukan verifikasi presensi.");
  }
  return res.json();
}

export async function enrollBiometric(payload: {
  employee_id: number;
  image_base64: string;
}): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${BASE_URL}/api/v1/enroll`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || "Gagal mendaftarkan biometrik.");
  }
  return res.json();
}

export async function fetchEmployees(): Promise<Employee[]> {
  const res = await fetch(`${BASE_URL}/api/v1/employees`);
  if (!res.ok) throw new Error("Gagal mengambil data karyawan");
  return res.json();
}

export async function createEmployee(data: Partial<Employee>): Promise<Employee> {
  const res = await fetch(`${BASE_URL}/api/v1/employees`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Gagal menambahkan karyawan");
  }
  return res.json();
}

export async function fetchAttendances(params?: {
  date?: string;
  department_id?: number;
  employee_id?: number;
}): Promise<AttendanceRecord[]> {
  const url = new URL(`${BASE_URL}/api/v1/attendances`, window.location.origin);
  if (params?.date) url.searchParams.append("date", params.date);
  if (params?.department_id) url.searchParams.append("department_id", String(params.department_id));
  if (params?.employee_id) url.searchParams.append("employee_id", String(params.employee_id));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Gagal mengambil riwayat absensi");
  return res.json();
}

export async function fetchDashboardStats(department_id?: number): Promise<DashboardStats> {
  const url = new URL(`${BASE_URL}/api/v1/attendances/stats`, window.location.origin);
  if (department_id) url.searchParams.append("department_id", String(department_id));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error("Gagal mengambil statistik dashboard");
  return res.json();
}

export async function fetchDepartments(): Promise<Department[]> {
  const res = await fetch(`${BASE_URL}/api/v1/departments`);
  if (!res.ok) throw new Error("Gagal mengambil data departemen");
  return res.json();
}

export async function fetchShifts(): Promise<Shift[]> {
  const res = await fetch(`${BASE_URL}/api/v1/shifts`);
  if (!res.ok) throw new Error("Gagal mengambil data shift");
  return res.json();
}

export async function fetchOffices(): Promise<OfficeLocation[]> {
  const res = await fetch(`${BASE_URL}/api/v1/offices`);
  if (!res.ok) throw new Error("Gagal mengambil data kantor");
  return res.json();
}
