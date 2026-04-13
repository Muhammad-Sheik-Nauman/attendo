from deepface import DeepFace
import pprint

res = DeepFace.represent("uploads/dummy.jpg", enforce_detection=False)
for r in res:
    print(r.keys())
    print("facial_area:", r.get("facial_area"))
