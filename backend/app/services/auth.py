import os
import json
import time
import base64
import hmac
import hashlib
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models import User, Employee, Department
from app.config import settings

AUTH_SECRET = getattr(settings, "SECRET_KEY", "corporate_biometric_attendance_secret_jwt_key_2026")

def hash_password(password: str) -> str:
    """PBKDF2-HMAC-SHA256 password hashing."""
    salt = os.urandom(16)
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 100000)
    return f"{salt.hex()}:{key.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifies a plain password against the stored PBKDF2 hash."""
    try:
        salt_hex, key_hex = hashed_password.split(":")
        salt = bytes.fromhex(salt_hex)
        key = bytes.fromhex(key_hex)
        new_key = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 100000)
        return hmac.compare_digest(key, new_key)
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_in_seconds: int = 86400 * 7) -> str:
    """Generates an HMAC-SHA256 signed JWT token."""
    header = {"alg": "HS256", "typ": "JWT"}
    payload = data.copy()
    payload["exp"] = int(time.time()) + expires_in_seconds

    h_b64 = base64.urlsafe_b64encode(json.dumps(header).encode()).decode().rstrip("=")
    p_b64 = base64.urlsafe_b64encode(json.dumps(payload).encode()).decode().rstrip("=")

    signing_input = f"{h_b64}.{p_b64}"
    sig = hmac.new(AUTH_SECRET.encode(), signing_input.encode(), hashlib.sha256).digest()
    sig_b64 = base64.urlsafe_b64encode(sig).decode().rstrip("=")

    return f"{signing_input}.{sig_b64}"

def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decodes and verifies an HMAC-SHA256 signed JWT token."""
    try:
        parts = token.split(".")
        if len(parts) != 3:
            return None
        h_b64, p_b64, sig_b64 = parts

        signing_input = f"{h_b64}.{p_b64}"
        expected_sig = hmac.new(AUTH_SECRET.encode(), signing_input.encode(), hashlib.sha256).digest()
        expected_sig_b64 = base64.urlsafe_b64encode(expected_sig).decode().rstrip("=")

        if not hmac.compare_digest(sig_b64, expected_sig_b64):
            return None

        # Pad payload base64 if needed
        rem = len(p_b64) % 4
        if rem > 0:
            p_b64 += "=" * (4 - rem)
        payload = json.loads(base64.urlsafe_b64decode(p_b64).decode())

        if payload.get("exp", 0) < time.time():
            return None

        return payload
    except Exception:
        return None

def seed_default_users(db: Session):
    """Auto-seeds demo accounts for ADMIN, MANAGER, and EMPLOYEE if not present."""
    default_users = [
        {
            "email": "admin@company.com",
            "name": "HR Administrator",
            "password": "password123",
            "role": "ADMIN",
            "employee_nik": None,
        },
        {
            "email": "manager.it@company.com",
            "name": "Hendra Wijaya (Manager IT)",
            "password": "password123",
            "role": "MANAGER",
            "employee_nik": "EMP003",
        },
        {
            "email": "budi@company.com",
            "name": "Budi Santoso",
            "password": "password123",
            "role": "EMPLOYEE",
            "employee_nik": "EMP001",
        },
    ]

    for u in default_users:
        existing = db.query(User).filter(User.email == u["email"]).first()
        if not existing:
            emp = None
            if u["employee_nik"]:
                emp = db.query(Employee).filter(Employee.nik == u["employee_nik"]).first()
            
            new_user = User(
                email=u["email"],
                name=u["name"],
                password_hash=hash_password(u["password"]),
                role=u["role"],
                employee_id=emp.id if emp else None,
                is_active=True,
            )
            db.add(new_user)
    
    try:
        db.commit()
    except Exception:
        db.rollback()
