from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Employee, EmployeeBiometric
from app.schemas import EnrollRequest, EnrollResponse, VerifyRequest, VerifyResponse
from app.services.face_engine import face_engine
from app.services.attendance import verify_and_record_attendance
import logging

router = APIRouter(prefix="", tags=["Biometrics & Verification"])
logger = logging.getLogger(__name__)

@router.post("/enroll", response_model=EnrollResponse)
def enroll_employee_biometric(payload: EnrollRequest, db: Session = Depends(get_db)):
    """
    Registers or updates face biometric embedding (512-D vector) for an employee.
    Extracts face features and stores vector in PostgreSQL via pgvector.
    """
    employee = db.query(Employee).filter(Employee.id == payload.employee_id).first()
    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Employee with ID {payload.employee_id} not found."
        )

    try:
        # Extract 512-D vector
        embedding = face_engine.extract_embedding(payload.image_base64)
        
        # Check if existing biometric exists, update or insert
        biometric = db.query(EmployeeBiometric).filter(
            EmployeeBiometric.employee_id == employee.id
        ).first()

        if biometric:
            biometric.embedding = embedding
            biometric.model_name = "arcface-r50-512"
        else:
            biometric = EmployeeBiometric(
                employee_id=employee.id,
                embedding=embedding,
                model_name="arcface-r50-512"
            )
            db.add(biometric)

        db.commit()

        return EnrollResponse(
            success=True,
            message=f"Biometrik wajah berhasil didaftarkan untuk {employee.name}.",
            employee_id=employee.id,
            embedding_dimensions=len(embedding)
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error enrolling biometric: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Gagal memproses biometrik: {str(e)}"
        )


@router.post("/verify", response_model=VerifyResponse)
def verify_attendance(payload: VerifyRequest, db: Session = Depends(get_db)):
    """
    Verifies live face capture against pgvector nearest neighbor index,
    computes device distance to assigned office with Haversine formula,
    checks shift times, and registers attendance.
    """
    try:
        result = verify_and_record_attendance(
            db=db,
            image_base64=payload.image_base64,
            device_lat=payload.latitude,
            device_lon=payload.longitude,
            attendance_type=payload.attendance_type or "CLOCK_IN"
        )
        return VerifyResponse(**result)
    except Exception as e:
        logger.error(f"Error verifying attendance: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Terjadi kesalahan saat verifikasi: {str(e)}"
        )
