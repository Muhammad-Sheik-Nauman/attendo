"""
Face detection and recognition service using DeepFace.
Handles multi-face detection, embedding generation, and face matching.
"""

import os
import cv2
import numpy as np
from PIL import Image
import io
import base64
from typing import List, Tuple, Optional
from deepface import DeepFace
from app.config import settings
from app.database import get_db


class FaceService:
    """Handles face detection, embedding generation, and recognition."""

    @staticmethod
    def generate_embedding(image_path: str) -> Optional[List[float]]:
        """
        Generate face embedding for a single face image.
        Used during student registration.
        """
        try:
            embeddings = DeepFace.represent(
                img_path=image_path,
                model_name=settings.FACE_MODEL,
                detector_backend=settings.FACE_DETECTOR_BACKEND,
                enforce_detection=False
            )
            
            if embeddings:
                return embeddings[0]["embedding"]
            return None
        except Exception as e:
            print(f"[ERROR] Embedding generation error: {e}")
            return None

    @staticmethod
    def get_faces_and_embeddings(image_path: str) -> List[dict]:
        """
        Detect faces, align them, and generate embeddings in a single pass.
        Returns a list of dicts: {"embedding": [...], "bbox": {x,y,w,h}}.
        """
        try:
            results = DeepFace.represent(
                img_path=image_path,
                model_name=settings.FACE_MODEL,
                detector_backend=settings.FACE_DETECTOR_BACKEND,
                enforce_detection=False
            )
            
            output = []
            for face_obj in results:
                # Filter out low-confidence face detections (prevents pants/leaves being seen as faces)
                # RetinaFace is very accurate, so 0.4 is a safe threshold
                if face_obj.get("face_confidence", 0) < 0.4:
                    continue
                    
                facial_area = face_obj.get("facial_area", {})
                if facial_area.get("w", 0) <= 0 or facial_area.get("h", 0) <= 0:
                    continue
                    
                output.append({
                    "embedding": face_obj.get("embedding"),
                    "bbox": {
                        "x": facial_area.get("x", 0),
                        "y": facial_area.get("y", 0),
                        "w": facial_area.get("w", 0),
                        "h": facial_area.get("h", 0)
                    }
                })
            return output
        except Exception as e:
            print(f"[ERROR] get_faces_and_embeddings error: {e}")
            return []

    @staticmethod
    def cosine_distance(emb1: List[float], emb2: List[float]) -> float:
        """Compute cosine distance between two embeddings. Lower = more similar."""
        a = np.array(emb1)
        b = np.array(emb2)
        dot = np.dot(a, b)
        norm_a = np.linalg.norm(a)
        norm_b = np.linalg.norm(b)
        
        if norm_a == 0 or norm_b == 0:
            return 1.0
        
        similarity = dot / (norm_a * norm_b)
        distance = 1.0 - similarity
        return distance

    @staticmethod
    async def match_face(
        embedding: List[float],
        class_section: Optional[str] = None
    ) -> Tuple[Optional[dict], float]:
        """
        Match a face embedding against stored student embeddings.
        Returns (student_doc, confidence_score) or (None, 0.0).
        """
        db = get_db()
        
        # Build query filter
        query = {"embeddings": {"$exists": True, "$ne": []}}
        if class_section:
            query["class_section"] = class_section
        
        best_match = None
        best_distance = float("inf")
        
        # Fetch all students with embeddings
        async for student in db.students.find(query):
            student_embeddings = student.get("embeddings", [])
            
            # Compare against all stored embeddings for this student
            for stored_emb in student_embeddings:
                distance = FaceService.cosine_distance(embedding, stored_emb)
                
                if distance < best_distance:
                    best_distance = distance
                    best_match = student
        
        # Convert distance to confidence percentage
        # Distance ranges: 0 (identical) to 2 (opposite)
        # Threshold: 0.60 means confidence >= ~40% for cosine distance
        confidence = max(0, (1 - best_distance)) * 100
        
        if best_distance <= settings.FACE_CONFIDENCE_THRESHOLD and best_match:
            return best_match, confidence
        
        return None, confidence

    @staticmethod
    def draw_results_on_image(
        image_path: str, 
        faces: List[dict],
        output_path: str
    ) -> str:
        """
        Draw bounding boxes and labels on the image.
        Returns the output path of the annotated image.
        """
        img = cv2.imread(image_path)
        
        if img is None:
            return image_path
        
        for face in faces:
            bbox = face.get("bbox", {})
            x, y, w, h = bbox.get("x", 0), bbox.get("y", 0), bbox.get("w", 0), bbox.get("h", 0)
            name = face.get("name", "Unknown")
            confidence = face.get("confidence", 0)
            status = face.get("status", "unknown")
            
            # Set color based on recognition status
            if status == "recognized":
                color = (0, 200, 100)  # Green
            else:
                color = (0, 80, 255)  # Orange-red for unknown
            
            # Draw bounding box
            cv2.rectangle(img, (x, y), (x + w, y + h), color, 2)
            
            # Prepare label
            label = f"{name} ({confidence:.0f}%)" if status == "recognized" else "Unknown"
            
            # Draw label background
            font = cv2.FONT_HERSHEY_SIMPLEX
            font_scale = 0.6
            thickness = 2
            (text_w, text_h), baseline = cv2.getTextSize(label, font, font_scale, thickness)
            
            cv2.rectangle(
                img,
                (x, y - text_h - 10),
                (x + text_w + 10, y),
                color,
                -1  # Filled
            )
            
            # Draw text
            cv2.putText(
                img, label,
                (x + 5, y - 5),
                font, font_scale,
                (255, 255, 255),  # White text
                thickness
            )
        
        cv2.imwrite(output_path, img)
        return output_path

    @staticmethod
    def image_to_base64(image_path: str) -> str:
        """Convert image file to base64 string for transmission to frontend."""
        with open(image_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")


face_service = FaceService()
