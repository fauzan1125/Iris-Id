from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Employee, EmployeeBiometric
from app.schemas import EmployeeCreate, EmployeeResponse

router = APIRouter(prefix="", tags=["Employees"])

@router.get("/employees", response_model=List[EmployeeResponse])
def list_employees(db: Session = Depends(get_db)):
    """Lists all active employees and shows if they have registered biometrics."""
    employees = db.query(Employee).order_by(Employee.id.asc()).all()
    
    # Check biometrics in bulk
    biometric_emp_ids = {b.employee_id for b in db.query(EmployeeBiometric.employee_id).all()}

    results = []
    for emp in employees:
        resp = EmployeeResponse.model_validate(emp)
        resp.has_biometric = emp.id in biometric_emp_ids
        results.append(resp)

    return results

@router.post("/employees", response_model=EmployeeResponse, status_code=status.HTTP_201_CREATED)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    """Registers a new employee."""
    existing = db.query(Employee).filter(
        (Employee.nik == payload.nik) | (Employee.email == payload.email)
    ).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Employee with this NIK or Email already exists."
        )

    emp = Employee(**payload.model_dump())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    
    resp = EmployeeResponse.model_validate(emp)
    resp.has_biometric = False
    return resp

@router.get("/employees/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    """Retrieves employee details."""
    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    
    has_bio = db.query(EmployeeBiometric).filter(EmployeeBiometric.employee_id == emp.id).first() is not None
    resp = EmployeeResponse.model_validate(emp)
    resp.has_biometric = has_bio
    return resp
