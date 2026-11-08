from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
import datetime
from app.database import get_db
from app.models import Attendance, Employee, Department
from app.schemas import AttendanceResponse, DashboardStats

router = APIRouter(prefix="", tags=["Attendances"])

@router.get("/attendances", response_model=List[AttendanceResponse])
def get_attendances(
    date: Optional[str] = Query(None, description="Format YYYY-MM-DD"),
    department_id: Optional[int] = Query(None),
    employee_id: Optional[int] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    db: Session = Depends(get_db)
):
    """Retrieves attendance history with optional filters."""
    query = db.query(Attendance).join(Employee)

    if date:
        try:
            target_date = datetime.datetime.strptime(date, "%Y-%m-%d").date()
            query = query.filter(func.date(Attendance.timestamp) == target_date)
        except ValueError:
            pass

    if department_id:
        query = query.filter(Employee.department_id == department_id)

    if employee_id:
        query = query.filter(Attendance.employee_id == employee_id)

    records = query.order_by(Attendance.timestamp.desc()).limit(limit).all()

    response = []
    for att in records:
        emp = att.employee
        response.append(
            AttendanceResponse(
                id=att.id,
                employee_id=emp.id,
                employee_nik=emp.nik,
                employee_name=emp.name,
                department_name=emp.department.name if emp.department else "-",
                timestamp=att.timestamp,
                attendance_type=att.attendance_type,
                status=att.status,
                distance_meters=round(att.distance_meters, 1),
                similarity_score=round(att.similarity_score, 4),
                photo_proof_url=att.photo_proof_url
            )
        )
    return response


@router.get("/attendances/stats", response_model=DashboardStats)
def get_attendance_stats(
    department_id: Optional[int] = Query(None),
    db: Session = Depends(get_db)
):
    """Computes daily attendance metrics for HR admin & Manager dashboard."""
    today = datetime.datetime.now(datetime.timezone.utc).date()
    
    emp_query = db.query(Employee).filter(Employee.is_active == True)
    if department_id:
        emp_query = emp_query.filter(Employee.department_id == department_id)
    total_employees = emp_query.count()
    
    att_query = db.query(Attendance).join(Employee).filter(
        func.date(Attendance.timestamp) == today
    )
    if department_id:
        att_query = att_query.filter(Employee.department_id == department_id)
    attendances_today = att_query.all()

    present_employee_ids = {a.employee_id for a in attendances_today if a.status in ["ON_TIME", "LATE"]}
    late_count = sum(1 for a in attendances_today if a.status == "LATE")
    out_of_range_count = sum(1 for a in attendances_today if a.status == "OUT_OF_RANGE")

    return DashboardStats(
        total_employees=total_employees,
        total_present_today=len(present_employee_ids),
        total_late_today=late_count,
        total_out_of_range=out_of_range_count
    )
