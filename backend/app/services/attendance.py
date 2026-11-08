import os
import uuid
import json
import datetime
import numpy as np
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.models import Employee, EmployeeBiometric, Attendance, OfficeLocation, Shift, is_postgres
from app.services.face_engine import face_engine
from app.services.geolocation import validate_geofence, haversine_distance
from app.config import settings

def save_proof_image(base64_img: str, employee_nik: str) -> str:
    """Saves verification/proof photo to storage folder and returns public URL."""
    try:
        os.makedirs(os.path.join(settings.STORAGE_DIR, "proofs"), exist_ok=True)
        filename = f"proof_{employee_nik}_{uuid.uuid4().hex[:8]}.jpg"
        filepath = os.path.join(settings.STORAGE_DIR, "proofs", filename)
        
        img = face_engine.decode_base64_image(base64_img)
        import cv2
        cv2.imwrite(filepath, img)
        return f"/storage/proofs/{filename}"
    except Exception as e:
        return ""

def verify_and_record_attendance(
    db: Session,
    image_base64: str,
    device_lat: float,
    device_lon: float,
    attendance_type: str = "CLOCK_IN"
) -> dict:
    """
    1. Extracts 512-D vector from input photo.
    2. Performs nearest neighbor matching:
       - Uses pgvector (<=>) if PostgreSQL
       - Uses vectorized NumPy cosine dot product if MySQL / Laragon
    3. Validates office location geofence via Haversine formula.
    4. Evaluates shift timing (ON_TIME, LATE, EARLY_LEAVE, OUT_OF_RANGE).
    5. Records attendance and returns comprehensive result.
    """
    now = datetime.datetime.now(datetime.timezone.utc)

    # 1. Extract 512-D vector
    query_vector = face_engine.extract_embedding(image_base64)
    query_np = np.array(query_vector, dtype=np.float64)

    employee_id = None
    similarity_score = 0.0
    cosine_distance = 1.0

    # 2. Nearest Neighbor Search
    if is_postgres:
        vector_str = f"[{','.join(str(v) for v in query_vector)}]"
        sql = text("""
            SELECT 
                b.id as biometric_id,
                b.employee_id,
                (b.embedding <=> :vec::vector) AS distance
            FROM employee_biometrics b
            JOIN employees e ON e.id = b.employee_id
            WHERE e.is_active = true
            ORDER BY distance ASC
            LIMIT 1;
        """)
        result = db.execute(sql, {"vec": vector_str}).fetchone()
        if result:
            employee_id = result.employee_id
            cosine_distance = float(result.distance)
            similarity_score = max(0.0, min(1.0, 1.0 - cosine_distance))
    else:
        # MySQL / Laragon / SQLite mode: Fast in-memory NumPy matrix vector search
        biometrics = db.query(EmployeeBiometric).join(Employee).filter(Employee.is_active == True).all()
        if biometrics:
            matrix = []
            valid_bios = []
            for b in biometrics:
                emb = b.embedding
                if isinstance(emb, str):
                    try:
                        emb = json.loads(emb)
                    except Exception:
                        continue
                if isinstance(emb, list) and len(emb) == 512:
                    matrix.append(emb)
                    valid_bios.append(b)

            if matrix:
                matrix_np = np.array(matrix, dtype=np.float64)
                # Cosine similarity for L2-normalized vectors is simply the dot product
                scores = np.dot(matrix_np, query_np)
                best_idx = int(np.argmax(scores))
                similarity_score = float(scores[best_idx])
                cosine_distance = max(0.0, 1.0 - similarity_score)
                employee_id = valid_bios[best_idx].employee_id

    if employee_id is None:
        return {
            "success": False,
            "message": "Tidak ada data biometrik yang terdaftar di sistem. Silakan daftarkan wajah terlebih dahulu di menu Karyawan.",
            "status": "NOT_FOUND",
            "attendance_type": attendance_type,
            "timestamp": now,
            "similarity_score": 0.0,
            "distance_meters": 0.0,
            "is_within_radius": False
        }

    # Check facial match threshold
    if cosine_distance > settings.MAX_COSINE_DISTANCE:
        return {
            "success": False,
            "message": f"Wajah tidak cocok dengan data karyawan terdaftar (Tingkat Kemiripan: {similarity_score * 100:.1f}%).",
            "status": "FACE_MISMATCH",
            "attendance_type": attendance_type,
            "timestamp": now,
            "similarity_score": round(similarity_score, 4),
            "distance_meters": 0.0,
            "is_within_radius": False
        }

    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        return {
            "success": False,
            "message": "Karyawan tidak ditemukan.",
            "status": "NOT_FOUND",
            "attendance_type": attendance_type,
            "timestamp": now,
            "similarity_score": round(similarity_score, 4),
            "distance_meters": 0.0,
            "is_within_radius": False
        }

    # 3. Geofence & Office Location check
    office = employee.office_location
    if not office:
        # Fallback to nearest office if not explicitly assigned
        offices = db.query(OfficeLocation).all()
        if offices:
            office = min(
                offices, 
                key=lambda o: haversine_distance(device_lat, device_lon, o.latitude, o.longitude)
            )

    is_within_radius = True
    dist_meters = 0.0
    office_name = "Default Office"

    if office:
        office_name = office.name
        is_within_radius, dist_meters = validate_geofence(
            device_lat, device_lon,
            office.latitude, office.longitude,
            office.radius_meters
        )

    # 4. Determine Attendance Status based on Shift & Geofence
    now = datetime.datetime.now(datetime.timezone.utc)
    current_time = now.time()
    
    if not is_within_radius:
        status = "OUT_OF_RANGE"
    else:
        status = "ON_TIME"
        if employee.shift:
            shift = employee.shift
            shift_start = shift.start_time
            shift_end = shift.end_time
            grace = shift.grace_period_minutes or 15

            if attendance_type == "CLOCK_IN":
                total_start_minutes = shift_start.hour * 60 + shift_start.minute + grace
                current_minutes = current_time.hour * 60 + current_time.minute
                if current_minutes > total_start_minutes:
                    status = "LATE"
            elif attendance_type == "CLOCK_OUT":
                total_end_minutes = shift_end.hour * 60 + shift_end.minute
                current_minutes = current_time.hour * 60 + current_time.minute
                if current_minutes < total_end_minutes:
                    status = "EARLY_LEAVE"

    # Save photo proof
    proof_url = save_proof_image(image_base64, employee.nik)

    # 5. Insert Attendance Record
    attendance = Attendance(
        employee_id=employee.id,
        timestamp=now,
        attendance_type=attendance_type,
        latitude=device_lat,
        longitude=device_lon,
        distance_meters=dist_meters,
        status=status,
        similarity_score=round(similarity_score, 4),
        photo_proof_url=proof_url
    )
    db.add(attendance)
    db.commit()
    db.refresh(attendance)

    msg_map = {
        "ON_TIME": "Presensi Berhasil Tepat Waktu!",
        "LATE": "Presensi Berhasil (Terlambat)",
        "EARLY_LEAVE": "Presensi Pulang Berhasil (Pulang Awal)",
        "OUT_OF_RANGE": f"Gagal: Lokasi di luar radius kantor ({dist_meters:.1f} m > {office.radius_meters if office else 100} m)"
    }

    return {
        "success": is_within_radius,
        "message": msg_map.get(status, "Presensi Berhasil"),
        "employee": {
            "id": employee.id,
            "nik": employee.nik,
            "name": employee.name,
            "department": employee.department.name if employee.department else "-",
            "photo_url": employee.photo_url
        },
        "attendance_id": attendance.id,
        "attendance_type": attendance_type,
        "timestamp": now,
        "status": status,
        "similarity_score": round(similarity_score, 4),
        "distance_meters": dist_meters,
        "office_name": office_name,
        "is_within_radius": is_within_radius
    }
