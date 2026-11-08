from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import User, Employee
from app.schemas import LoginRequest, LoginResponse, UserProfileResponse
from app.services.auth import (
    verify_password, 
    create_access_token, 
    decode_access_token,
    seed_default_users
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

def format_user_profile(user: User) -> UserProfileResponse:
    dept_id = None
    dept_name = None
    nik = None

    if user.employee:
        nik = user.employee.nik
        if user.employee.department:
            dept_id = user.employee.department.id
            dept_name = user.employee.department.name

    return UserProfileResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
        employee_id=user.employee_id,
        department_id=dept_id,
        department_name=dept_name,
        nik=nik,
        is_active=user.is_active,
    )

def get_current_user(
    authorization: str = Header(None),
    db: Session = Depends(get_db)
) -> User:
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autentikasi diperlukan. Header Authorization tidak ditemukan.",
        )
    
    token = authorization
    if token.startswith("Bearer "):
        token = token[7:]

    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesi login kedaluwarsa atau tidak valid. Silakan login kembali.",
        )

    user = db.query(User).filter(User.id == payload["sub"]).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Akun pengguna tidak ditemukan atau tidak aktif.",
        )
    return user

@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    # Auto-seed demo users if database is fresh
    seed_default_users(db)

    # Search user by email or by employee NIK
    user = db.query(User).filter(User.email == payload.email).first()
    if not user:
        # Check if email is actually an employee NIK
        emp = db.query(Employee).filter(Employee.nik == payload.email).first()
        if emp and emp.user:
            user = emp.user

    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email/NIK atau kata sandi yang Anda masukkan salah.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Akun Anda dinonaktifkan. Hubungi Administrator HR.",
        )

    token = create_access_token({
        "sub": user.id,
        "email": user.email,
        "role": user.role,
        "employee_id": user.employee_id,
    })

    return LoginResponse(
        token=token,
        user=format_user_profile(user)
    )

@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return format_user_profile(current_user)
