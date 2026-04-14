"""
Attendance routes: group photo processing, history, and dashboard.
"""

import os
import uuid
from datetime import datetime, date
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.database import get_db
from app.services.face_service import face_service
from app.services.telegram_service import telegram_service
from app.config import settings

router = APIRouter(prefix="/api/attendance", tags=["Attendance"])


@router.post("/process")
async def process_attendance(
    file: UploadFile = File(...),
    class_section: str = Form(...)
):
    """
    Main attendance processing endpoint.
    1. Receives a classroom group photo
    2. Detects all faces
    3. Matches each face against registered students
    4. Records attendance and sends Telegram notifications
    """
    db = get_db()
    
    # Validate file
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are supported"
        )
    
    # Save uploaded image
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"attendance_{uuid.uuid4().hex}.{file_ext}"
    file_path = os.path.join(settings.UPLOAD_DIR, "attendance", filename)
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Step 1: Detect all faces and generate embeddings in one pipeline
    detected_faces = face_service.get_faces_and_embeddings(file_path)
    
    if not detected_faces:
        return {
            "success": True,
            "message": "No faces detected in the image",
            "total_faces": 0,
            "recognized": 0,
            "unknown": 0,
            "faces": [],
            "image_base64": face_service.image_to_base64(file_path),
            "date": date.today().strftime("%d %B %Y"),
            "time": datetime.now().strftime("%I:%M %p")
        }
    
    results = []
    recognized_count = 0
    unknown_count = 0
    today_str = date.today().isoformat()
    current_time = datetime.now().strftime("%I:%M %p")
    current_date = date.today().strftime("%d %B %Y")
    
    recognized_student_ids = set()
    for face_data in detected_faces:
        bbox = face_data["bbox"]
        x, y, w, h = bbox["x"], bbox["y"], bbox["w"], bbox["h"]
        embedding = face_data.get("embedding")
        
        if not embedding:
            unknown_count += 1
            results.append({
                "name": "Unknown",
                "student_id": None,
                "confidence": 0,
                "bbox": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)},
                "status": "unknown"
            })
            continue
        
        # Step 2: Match against stored embeddings
        matched_student, confidence = await face_service.match_face(
            embedding, class_section
        )
        
        if matched_student:
            recognized_count += 1
            student_name = matched_student["name"]
            student_sid = matched_student["student_id"]
            recognized_student_ids.add(student_sid)
            
            # Step 5: Record attendance (ensure we record 'present' even if previously marked 'absent')
            attendance_record = await db.attendance.find_one({
                "student_id": student_sid,
                "date": today_str
            })
            
            telegram_sent = False
            
            if not attendance_record:
                # First time seeing them today - record as present
                await db.attendance.insert_one({
                    "student_id": student_sid,
                    "student_name": student_name,
                    "class_section": matched_student["class_section"],
                    "status": "present",
                    "confidence": round(confidence, 2),
                    "date": today_str,
                    "time": current_time,
                    "timestamp": datetime.utcnow()
                })
            elif attendance_record.get("status") == "absent":
                # They were previously marked absent (maybe in a different photo) 
                # but are now PRESENT. Update the record!
                await db.attendance.update_one(
                    {"_id": attendance_record["_id"]},
                    {"$set": {
                        "status": "present",
                        "time": current_time,
                        "confidence": round(confidence, 2),
                        "timestamp": datetime.utcnow()
                    }}
                )

            # Send Telegram notification every time face is recognized
            chat_id = matched_student.get("telegram_chat_id")
            if chat_id:
                telegram_sent = await telegram_service.send_attendance_notification(
                    chat_id=chat_id,
                    student_name=student_name,
                    status="present",
                    time_str=current_time,
                    date_str=current_date
                )
            
            results.append({
                "name": student_name,
                "student_id": student_sid,
                "confidence": round(confidence, 2),
                "bbox": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)},
                "status": "recognized",
                "telegram_sent": telegram_sent
            })
        else:
            unknown_count += 1
            results.append({
                "name": "Unknown",
                "student_id": None,
                "confidence": round(confidence, 2),
                "bbox": {"x": int(x), "y": int(y), "w": int(w), "h": int(h)},
                "status": "unknown"
            })
    
    # Step 6: Identify and Notify Absentees
    absent_count = 0
    absentees_notified = 0
    
    # Get all students in this class section
    all_class_students = await db.students.find({"class_section": class_section}).to_list(length=1000)
    
    for student in all_class_students:
        if student["student_id"] not in recognized_student_ids:
            absent_count += 1
            
            # Check if already marked present today (maybe in a previous photo)
            already_present = await db.attendance.find_one({
                "student_id": student["student_id"],
                "date": today_str,
                "status": "present"
            })
            
            if not already_present:
                # Record as absent in DB if not already recorded today
                existing_absent_record = await db.attendance.find_one({
                    "student_id": student["student_id"],
                    "date": today_str,
                    "status": "absent"
                })
                
                if not existing_absent_record:
                    await db.attendance.insert_one({
                        "student_id": student["student_id"],
                        "student_name": student["name"],
                        "class_section": student["class_section"],
                        "status": "absent",
                        "confidence": 0,
                        "date": today_str,
                        "time": current_time,
                        "timestamp": datetime.utcnow()
                    })

                # Send Telegram "Absent" notification
                chat_id = student.get("telegram_chat_id")
                if chat_id:
                    notified = await telegram_service.send_attendance_notification(
                        chat_id=chat_id,
                        student_name=student["name"],
                        status="absent",
                        time_str=current_time,
                        date_str=current_date
                    )
                    if notified:
                        absentees_notified += 1

    # Step 7: Draw results on image
    output_filename = f"result_{filename}"
    output_path = os.path.join(settings.UPLOAD_DIR, "attendance", output_filename)
    face_service.draw_results_on_image(file_path, results, output_path)
    
    # Convert result image to base64
    result_image_base64 = face_service.image_to_base64(output_path)
    
    return {
        "success": True,
        "message": f"Processed {len(results)} faces. {recognized_count} Present, {absent_count} Absent ({absentees_notified} notified).",
        "total_faces": len(results),
        "recognized": recognized_count,
        "unknown": unknown_count,
        "absent": absent_count,
        "absentees_notified": absentees_notified,
        "faces": results,
        "image_base64": result_image_base64,
        "date": current_date,
        "time": current_time
    }


@router.get("/history")
async def get_attendance_history(
    class_section: Optional[str] = None,
    date_filter: Optional[str] = None,
    student_id: Optional[str] = None
):
    """Get attendance history with optional filters."""
    db = get_db()
    
    query = {}
    if class_section:
        query["class_section"] = class_section
    if date_filter:
        query["date"] = date_filter
    if student_id:
        query["student_id"] = student_id
    
    records = []
    async for record in db.attendance.find(query).sort("timestamp", -1).limit(500):
        records.append({
            "id": str(record["_id"]),
            "student_id": record["student_id"],
            "student_name": record["student_name"],
            "class_section": record["class_section"],
            "status": record["status"],
            "confidence": record.get("confidence", 0),
            "date": record["date"],
            "time": record.get("time", ""),
            "timestamp": record.get("timestamp", datetime.utcnow()).isoformat()
        })
    
    return {"records": records, "total": len(records)}


@router.get("/summary")
async def get_attendance_summary(
    class_section: Optional[str] = None,
    date_filter: Optional[str] = None
):
    """Get attendance summary statistics."""
    db = get_db()
    
    today_str = date_filter or date.today().isoformat()
    
    query = {"date": today_str}
    if class_section:
        query["class_section"] = class_section
    
    # Count present students today
    present_count = await db.attendance.count_documents({**query, "status": "present"})
    
    # Total students in class
    student_query = {}
    if class_section:
        student_query["class_section"] = class_section
    total_students = await db.students.count_documents(student_query)
    
    absent_count = total_students - present_count
    rate = (present_count / total_students * 100) if total_students > 0 else 0
    
    return {
        "date": today_str,
        "total_students": total_students,
        "present": present_count,
        "absent": max(0, absent_count),
        "attendance_rate": round(rate, 1)
    }


@router.get("/dashboard")
async def get_dashboard_stats():
    """Get comprehensive dashboard statistics."""
    db = get_db()
    
    today_str = date.today().isoformat()
    
    # Total students
    total_students = await db.students.count_documents({})
    
    # Present today
    present_today = await db.attendance.count_documents({
        "date": today_str,
        "status": "present"
    })
    
    # Total classes
    classes = await db.students.distinct("class_section")
    total_classes = len(classes)
    
    # Absent today
    absent_today = total_students - present_today
    
    # Attendance rate
    rate = (present_today / total_students * 100) if total_students > 0 else 0
    
    # Recent attendance (last 10 records)
    recent = []
    async for record in db.attendance.find().sort("timestamp", -1).limit(10):
        recent.append({
            "student_name": record["student_name"],
            "student_id": record["student_id"],
            "class_section": record["class_section"],
            "status": record["status"],
            "date": record["date"],
            "time": record.get("time", "")
        })
    
    # Weekly trend (last 7 days)
    weekly_trend = []
    for i in range(6, -1, -1):
        from datetime import timedelta
        d = date.today() - timedelta(days=i)
        d_str = d.isoformat()
        count = await db.attendance.count_documents({
            "date": d_str,
            "status": "present"
        })
        weekly_trend.append({
            "date": d_str,
            "day": d.strftime("%a"),
            "present": count,
            "total": total_students
        })
    
    return {
        "total_students": total_students,
        "present_today": present_today,
        "absent_today": max(0, absent_today),
        "attendance_rate": round(rate, 1),
        "total_classes": total_classes,
        "classes": classes,
        "recent_attendance": recent,
        "weekly_trend": weekly_trend
    }


@router.get("/student-stats")
async def get_student_stats(
    class_section: Optional[str] = None
):
    """
    Get attendance statistics for each student:
    - Attended classes count
    - Total classes held (unique dates with attendance for that section)
    - Attendance percentage
    """
    db = get_db()
    
    # 1. Get students
    student_query = {}
    if class_section:
        student_query["class_section"] = class_section
    
    students = []
    async for s in db.students.find(student_query):
        students.append({
            "student_id": s["student_id"],
            "name": s["name"],
            "class_section": s["class_section"]
        })
    
    if not students:
        return {"stats": []}
        
    # 2. Get total classes held per section
    # A "class held" is defined as a unique date that has at least one attendance record for that section
    pipeline = [
        {"$group": {"_id": {"class_section": "$class_section", "date": "$date"}}},
        {"$group": {"_id": "$_id.class_section", "count": {"$sum": 1}}}
    ]
    
    section_counts = {}
    async for result in db.attendance.aggregate(pipeline):
        section_counts[result["_id"]] = result["count"]
        
    # 3. Get attendance count for each student
    student_attendance_counts = {}
    attendance_pipeline = [
        {"$match": {"status": "present"}},
        {"$group": {"_id": "$student_id", "count": {"$sum": 1}}}
    ]
    
    async for result in db.attendance.aggregate(attendance_pipeline):
        student_attendance_counts[result["_id"]] = result["count"]
        
    # 4. Combine data
    stats = []
    for s in students:
        attended = student_attendance_counts.get(s["student_id"], 0)
        total = section_counts.get(s["class_section"], 0)
        
        # If total is 0 but student is present, it means there's an inconsistency, 
        # but logically total should be at least 'attended' or the section count.
        # We ensure total is at least as much as attended.
        total = max(total, attended)
        
        percentage = (attended / total * 100) if total > 0 else 0
        
        stats.append({
            "student_id": s["student_id"],
            "name": s["name"],
            "class_section": s["class_section"],
            "attended": attended,
            "total": total,
            "percentage": round(percentage, 1)
        })
        
    # Sort by percentage (descending)
    stats.sort(key=lambda x: x["percentage"], reverse=True)
    
    return {"stats": stats}



@router.get("/export")
async def export_attendance(
    class_section: Optional[str] = None,
    date_filter: Optional[str] = None
):
    """Export attendance data as CSV-compatible JSON."""
    db = get_db()
    
    query = {}
    if class_section:
        query["class_section"] = class_section
    if date_filter:
        query["date"] = date_filter
    
    records = []
    async for record in db.attendance.find(query).sort("timestamp", -1):
        records.append({
            "Student ID": record["student_id"],
            "Name": record["student_name"],
            "Class": record["class_section"],
            "Status": record["status"],
            "Confidence": record.get("confidence", 0),
            "Date": record["date"],
            "Time": record.get("time", "")
        })
    
    return {"data": records, "total": len(records)}
