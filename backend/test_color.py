import cv2
import numpy as np
from app.services.face_service import face_service
from app.config import settings
from deepface import DeepFace

# Person 1
dummy_img1 = np.zeros((160, 160, 3), dtype=np.uint8)
cv2.rectangle(dummy_img1, (40, 40), (120, 120), (255, 200, 200), -1) 
cv2.imwrite("test_face1.jpg", dummy_img1)

# Person 2
dummy_img2 = np.zeros((160, 160, 3), dtype=np.uint8)
cv2.circle(dummy_img2, (80, 80), 40, (100, 100, 255), -1) 
cv2.imwrite("test_face2.jpg", dummy_img2)

emb1 = face_service.generate_embedding("test_face1.jpg")
emb2 = face_service.generate_embedding("test_face2.jpg")

print("Dist(Person1, Person2):", face_service.cosine_distance(emb1, emb2))
