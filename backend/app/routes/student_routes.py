"""
Student management routes: CRUD operations and face registration.
"""

import os
import uuid
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status, Depends
from app.database import get_db
from app.services.face_service import face_service
from app.services.auth_service import get_current_user
from app.config import settings

router = APIRouter(prefix="/api/students", tags=["Students"])


@router.post("/register")
async def register_student(
    name: str = Form(...),
    student_id: str = Form(...),
    class_section: str = Form(...),
    telegram_chat_id: Optional[str] = Form(None),
):
    """Register a new student."""
    db = get_db()
    
    # Check if student_id already exists
    existing = await db.students.find_one({"student_id": student_id})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Student with ID '{student_id}' already exists"
        )
    
    student_doc = {
        "name": name,
        "student_id": student_id,
        "class_section": class_section,
        "telegram_chat_id": telegram_chat_id,
        "embeddings": [],
        "image_paths": [],
        "image_count": 0,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = await db.students.insert_one(student_doc)
    
    return {
        "success": True,
        "message": f"Student '{name}' registered successfully",
        "id": str(result.inserted_id)
    }


@router.post("/{student_id}/upload-face")
async def upload_face_image(
    student_id: str,
    file: UploadFile = File(...)
):
    """
    Upload a face image for a student and generate embedding.
    Should be called multiple times (5-10 images) for better accuracy.
    """
    db = get_db()
    
    student = await db.students.find_one({"student_id": student_id})
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student '{student_id}' not found"
        )
    
    # Validate file type
    if not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed"
        )
    
    # Save the image
    student_dir = os.path.join(settings.UPLOAD_DIR, "students", student_id)
    os.makedirs(student_dir, exist_ok=True)
    
    file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
    filename = f"{uuid.uuid4().hex}.{file_ext}"
    file_path = os.path.join(student_dir, filename)
    
    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Generate face embedding
    embedding = face_service.generate_embedding(file_path)
    
    if embedding is None:
        os.remove(file_path)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No face detected in the uploaded image. Please upload a clear face photo."
        )
    
    # Update student with new embedding and image path
    await db.students.update_one(
        {"student_id": student_id},
        {
            "$push": {
                "embeddings": embedding,
                "image_paths": file_path
            },
            "$inc": {"image_count": 1},
            "$set": {"updated_at": datetime.utcnow()}
        }
    )
    
    updated = await db.students.find_one({"student_id": student_id})
    
    return {
        "success": True,
        "message": f"Face image uploaded and embedding generated",
        "image_count": updated.get("image_count", 0),
        "filename": filename
    }


@router.get("/")
async def list_students(
    class_section: Optional[str] = None,
    search: Optional[str] = None
):
    """List all students with optional filters."""
    db = get_db()
    
    query = {}
    if class_section:
        query["class_section"] = class_section
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"student_id": {"$regex": search, "$options": "i"}}
        ]
    
    students = []
    async for student in db.students.find(query).sort("name", 1):
        students.append({
            "id": str(student["_id"]),
            "name": student["name"],
            "student_id": student["student_id"],
            "class_section": student["class_section"],
            "telegram_chat_id": student.get("telegram_chat_id"),
            "image_count": student.get("image_count", 0),
            "has_embeddings": len(student.get("embeddings", [])) > 0,
            "created_at": student.get("created_at", datetime.utcnow()).isoformat()
        })
    
    return {"students": students, "total": len(students)}


@router.get("/classes")
async def list_classes():
    """Get all unique class sections."""
    db = get_db()
    classes = await db.students.distinct("class_section")
    return {"classes": sorted(classes)}


@router.get("/{student_id}")
async def get_student(student_id: str):
    """Get a single student's details."""
    db = get_db()
    student = await db.students.find_one({"student_id": student_id})
    
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student '{student_id}' not found"
        )
    
    return {
        "id": str(student["_id"]),
        "name": student["name"],
        "student_id": student["student_id"],
        "class_section": student["class_section"],
        "telegram_chat_id": student.get("telegram_chat_id"),
        "image_count": student.get("image_count", 0),
        "has_embeddings": len(student.get("embeddings", [])) > 0,
        "created_at": student.get("created_at", datetime.utcnow()).isoformat()
    }


@router.put("/{student_id}")
async def update_student(
    student_id: str,
    name: Optional[str] = Form(None),
    new_student_id: Optional[str] = Form(None),
    class_section: Optional[str] = Form(None),
    telegram_chat_id: Optional[str] = Form(None)
):
    """Update student details."""
    db = get_db()
    
    student = await db.students.find_one({"student_id": student_id})
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student '{student_id}' not found"
        )
    
    update_fields = {"updated_at": datetime.utcnow()}
    if name:
        update_fields["name"] = name
    if class_section:
        update_fields["class_section"] = class_section
    if telegram_chat_id is not None:
        update_fields["telegram_chat_id"] = telegram_chat_id
        
    if new_student_id and new_student_id != student_id:
        existing = await db.students.find_one({"student_id": new_student_id})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Student ID '{new_student_id}' is already in use"
            )
        
        update_fields["student_id"] = new_student_id
        
        # Rename image folder
        old_dir = os.path.join(settings.UPLOAD_DIR, "students", student_id)
        new_dir = os.path.join(settings.UPLOAD_DIR, "students", new_student_id)
        if os.path.exists(old_dir):
            import shutil
            shutil.move(old_dir, new_dir)
            
        # Update stored image_paths
        new_paths = []
        old_dir_str = os.path.join("students", student_id)
        new_dir_str = os.path.join("students", new_student_id)
        for p in student.get("image_paths", []):
            new_paths.append(p.replace(old_dir_str, new_dir_str))
        
        if new_paths:
            update_fields["image_paths"] = new_paths
            
        # Cascade update to attendance collection
        await db.attendance.update_many(
            {"student_id": student_id},
            {"$set": {"student_id": new_student_id}}
        )
    
    await db.students.update_one(
        {"_id": student["_id"]},
        {"$set": update_fields}
    )
    
    return {"success": True, "message": "Student updated successfully"}


@router.delete("/{student_id}")
async def delete_student(student_id: str):
    """Delete a student and their face data."""
    db = get_db()
    
    student = await db.students.find_one({"student_id": student_id})
    if not student:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student '{student_id}' not found"
        )
    
    # Delete stored images
    student_dir = os.path.join(settings.UPLOAD_DIR, "students", student_id)
    if os.path.exists(student_dir):
        import shutil
        shutil.rmtree(student_dir)
    
    # Delete from database
    await db.students.delete_one({"student_id": student_id})
    
    # Delete attendance records
    await db.attendance.delete_many({"student_id": student_id})
    
    return {"success": True, "message": f"Student '{student_id}' deleted"}


@router.post("/{student_id}/telegram")
async def update_telegram_chat_id(
    student_id: str,
    chat_id: str = Form(...)
):
    """Update student's Telegram chat ID."""
    db = get_db()
    
    result = await db.students.update_one(
        {"student_id": student_id},
        {"$set": {
            "telegram_chat_id": chat_id,
            "updated_at": datetime.utcnow()
        }}
    )
    
    if result.matched_count == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Student '{student_id}' not found"
        )
    
    return {"success": True, "message": "Telegram chat ID updated"}
