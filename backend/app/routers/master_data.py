from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app.models import Department, Shift, OfficeLocation
from app.schemas import DepartmentResponse, ShiftResponse, OfficeLocationResponse

router = APIRouter(prefix="", tags=["Master Data"])

@router.get("/departments", response_model=List[DepartmentResponse])
def get_departments(db: Session = Depends(get_db)):
    return db.query(Department).all()

@router.get("/shifts", response_model=List[ShiftResponse])
def get_shifts(db: Session = Depends(get_db)):
    return db.query(Shift).all()

@router.get("/offices", response_model=List[OfficeLocationResponse])
def get_office_locations(db: Session = Depends(get_db)):
    return db.query(OfficeLocation).all()
