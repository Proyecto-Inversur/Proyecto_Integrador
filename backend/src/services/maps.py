from fastapi import HTTPException   
from pydantic import BaseModel
from typing import List
from firebase_admin import db
from auth.firebase import initialize_firebase

class User(BaseModel):
    id: str
    name: str
    lat: float
    lng: float

async def get_locations(current_entity: dict) -> List[User]:
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    try:
        initialize_firebase()
        ref = db.reference('/users')
        users_data = ref.get()
        if users_data is None:
            return []
        if isinstance(users_data, list):
            return [
                User(id=str(i), name=data.get('name', 'Unknown'), lat=data.get('lat', 0.0), lng=data.get('lng', 0.0))
                for i, data in enumerate(users_data) if data is not None
            ]
        return [
            User(id=user_id, name=data.get('name', 'Unknown'), lat=data.get('lat', 0.0), lng=data.get('lng', 0.0))
            for user_id, data in users_data.items()
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")

async def update_location(current_entity: dict, user_id: str, name: str, lat: float, lng: float):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    try:
        initialize_firebase()
        ref = db.reference(f'/users/{user_id}')
        ref.set({
            'name': name,
            'lat': lat,
            'lng': lng
        })
        return {"message": f"Ubicación actualizada para {user_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error actualizando ubicación: {str(e)}")