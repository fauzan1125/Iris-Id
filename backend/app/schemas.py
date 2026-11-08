from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime, time

# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    code: str

class DepartmentResponse(DepartmentBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Shift Schemas
class ShiftBase(BaseModel):
    name: str
    start_time: time
    end_time: time
    grace_period_minutes: int = 15

class ShiftResponse(ShiftBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Office Location Schemas
class OfficeLocationBase(BaseModel):
    name: str
    address: Optional[str] = None
    latitude: float
    longitude: float
    radius_meters: float = 100.0

class OfficeLocationResponse(OfficeLocationBase):
    id: int
    created_at: datetime
    class Config:
        from_attributes = True

# Employee Schemas
class EmployeeBase(BaseModel):
    nik: str
    name: str
    email: str
    department_id: Optional[int] = None
    shift_id: Optional[int] = None
    office_location_id: Optional[int] = None
    is_active: bool = True

class EmployeeCreate(EmployeeBase):
    pass

class EmployeeResponse(EmployeeBase):
    id: int
    photo_url: Optional[str] = None
    created_at: datetime
    has_biometric: bool = False
    department: Optional[DepartmentResponse] = None
    shift: Optional[ShiftResponse] = None
    office_location: Optional[OfficeLocationResponse] = None
    class Config:
        from_attributes = True

# Biometric & Verification Schemas
class EnrollRequest(BaseModel):
    employee_id: int
    image_base64: str

class EnrollResponse(BaseModel):
    success: bool
    message: str
    employee_id: int
    embedding_dimensions: int

class VerifyRequest(BaseModel):
    image_base64: str
    latitude: float
    longitude: float
    attendance_type: Optional[str] = "CLOCK_IN"  # CLOCK_IN or CLOCK_OUT

class VerifyResponse(BaseModel):
    success: bool
    message: str
    employee: Optional[dict] = None
    attendance_id: Optional[int] = None
    attendance_type: Optional[str] = "CLOCK_IN"
    timestamp: Optional[datetime] = None
    status: str
    similarity_score: float = 0.0
    distance_meters: float = 0.0
    office_name: Optional[str] = None
    is_within_radius: bool = False

# Attendance Log Schemas
class AttendanceResponse(BaseModel):
    id: int
    employee_id: int
    employee_nik: str
    employee_name: str
    department_name: Optional[str]
    timestamp: datetime
    attendance_type: str
    status: str
    distance_meters: float
    similarity_score: float
    photo_proof_url: Optional[str]
    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_employees: int
    total_present_today: int
    total_late_today: int
    total_out_of_range: int

# Auth Schemas
class LoginRequest(BaseModel):
    email: str
    password: str

class UserProfileResponse(BaseModel):
    id: int
    email: str
    name: str
    role: str
    employee_id: Optional[int] = None
    department_id: Optional[int] = None
    department_name: Optional[str] = None
    nik: Optional[str] = None
    is_active: bool

class LoginResponse(BaseModel):
    token: str
    user: UserProfileResponse
