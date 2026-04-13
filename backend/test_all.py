import asyncio
import sys
from app.database import connect_db, close_db, get_db
from app.services.face_service import face_service

async def test():
    db = await connect_db()
    
    students = []
    async for s in db.students.find({"embeddings": {"$exists": True, "$ne": []}}):
        students.append(s)
        print(f"Loaded student: {s['name']} - {len(s['embeddings'])} embeddings")
    
    if len(students) < 2:
        print("Not enough students to compare cross-distance")
    
    for i, s1 in enumerate(students):
        print(f"\n--- Testing Distances for {s1['name']} ---")
        for e1 in s1['embeddings']:
            # Distance with themselves?
            self_dists = [face_service.cosine_distance(e1, e2) for e2 in s1['embeddings']]
            print(f"Self distances: {[round(d, 4) for d in self_dists]}")
            
            for j, s2 in enumerate(students):
                if i != j:
                    cross_dists = [face_service.cosine_distance(e1, e2) for e2 in s2['embeddings']]
                    print(f"Dist vs {s2['name']}: min={round(min(cross_dists), 4)}")
            break # just do first embedding

    await close_db()

if __name__ == '__main__':
    asyncio.run(test())
