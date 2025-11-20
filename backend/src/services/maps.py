from fastapi import HTTPException   
from sqlalchemy.orm import Session
from api.models import CorrectivoSeleccionado, PreventivoSeleccionado
from pydantic import BaseModel
from typing import List
from firebase_admin import db
from auth.firebase import initialize_firebase

class Sucursal(BaseModel):
    id: str
    name: str
    lat: float
    lng: float
    
class Usuarios(BaseModel):
    id: str
    tipo: str
    name: str
    lat: float
    lng: float

async def get_sucursales_locations(current_entity: dict) -> List[Sucursal]:
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    try:
        initialize_firebase()
        ref = db.reference('/sucursales')
        sucursales_data = ref.get()
        if sucursales_data is None:
            return []
        if isinstance(sucursales_data, list):
            return [
                Sucursal(id=str(i), name=data.get('name', 'Unknown'), lat=data.get('lat', 0.0), lng=data.get('lng', 0.0))
                for i, data in enumerate(sucursales_data) if data is not None
            ]
        return [
            Sucursal(id=sucursal_id, name=data.get('name', 'Unknown'), lat=data.get('lat', 0.0), lng=data.get('lng', 0.0))
            for sucursal_id, data in sucursales_data.items()
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error obteniendo sucursales de Firebase: {str(e)}")

async def get_users_locations(current_entity: dict) -> List[Usuarios]:
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    try:
        initialize_firebase()
        ref = db.reference('/users')
        users_data = ref.get()

        if not users_data:
            return []

        return [
            Usuarios(
                id=data.get("id"),
                tipo=data.get("tipo"),
                name=data.get("name", "Unknown"),
                lat=data.get("lat", 0.0),
                lng=data.get("lng", 0.0)
            )
            for data in users_data.values()
            if data
        ]

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching users: {str(e)}")
    
def get_correctivos(db_session: Session, id_cuadrilla: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    correctivos = db_session.query(CorrectivoSeleccionado).filter(CorrectivoSeleccionado.id_cuadrilla == id_cuadrilla).all()
    if not correctivos:
        return []
    return correctivos

def get_preventivos(db_session: Session, id_cuadrilla: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    preventivos = db_session.query(PreventivoSeleccionado).filter(PreventivoSeleccionado.id_cuadrilla == id_cuadrilla).all()
    if not preventivos:
        return []
    return preventivos

async def update_user_location(current_entity: dict, firebase_uid: str, user_id: str, tipo: str, name: str, lat: float, lng: float):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    try:
        initialize_firebase()
        ref = db.reference(f'/users/{firebase_uid}')
        ref.set({
            'id': user_id,
            'tipo': tipo,
            'name': name,
            'lat': lat,
            'lng': lng
        })
        return {"message": f"Ubicación actualizada para {user_id}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error actualizando ubicación: {str(e)}")

def update_correctivo(db_session: Session, id_cuadrilla: int, id_mantenimiento: int, id_sucursal: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    existing_correctivo = db_session.query(CorrectivoSeleccionado).filter(
        CorrectivoSeleccionado.id_cuadrilla == id_cuadrilla,
        CorrectivoSeleccionado.id_mantenimiento == id_mantenimiento
    ).first()

    if existing_correctivo:
        raise HTTPException(status_code=400, detail="El correctivo ya fue seleccionado anteriormente")
    
    try:
        db_correctivo = CorrectivoSeleccionado(id_cuadrilla=id_cuadrilla, id_mantenimiento=id_mantenimiento, id_sucursal=id_sucursal)
        db_session.add(db_correctivo)
        db_session.commit()
        db_session.refresh(db_correctivo)
        return db_correctivo
    except Exception as e:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=f"Error al guardar correctivo: {str(e)}")

def update_preventivo(db_session: Session, id_cuadrilla: int, id_mantenimiento: int, id_sucursal: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    existing_preventivo = db_session.query(PreventivoSeleccionado).filter(
        PreventivoSeleccionado.id_cuadrilla == id_cuadrilla,
        PreventivoSeleccionado.id_mantenimiento == id_mantenimiento
    ).first()
    
    if existing_preventivo:
        raise HTTPException(status_code=400, detail="El preventivo ya fue seleccionado anteriormente")
    
    try:
        db_preventivo = PreventivoSeleccionado(id_cuadrilla=id_cuadrilla, id_mantenimiento=id_mantenimiento, id_sucursal=id_sucursal)
        db_session.add(db_preventivo)
        db_session.commit()
        db_session.refresh(db_preventivo)
        return db_preventivo
    except Exception as e:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=f"Error al guardar preventivo: {str(e)}")
    
def delete_sucursal(db_session: Session, id_cuadrilla: int, id_sucursal: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    correctivos = db_session.query(CorrectivoSeleccionado).filter(
        CorrectivoSeleccionado.id_cuadrilla == id_cuadrilla,
        CorrectivoSeleccionado.id_sucursal == id_sucursal
    ).all()
    if correctivos:
        for correctivo in correctivos:
            db_session.delete(correctivo)
        
    preventivos = db_session.query(PreventivoSeleccionado).filter(
        PreventivoSeleccionado.id_cuadrilla == id_cuadrilla,
        PreventivoSeleccionado.id_sucursal == id_sucursal
    ).all()
    if preventivos:
        for preventivo in preventivos:
            db_session.delete(preventivo)

    db_session.commit()
    return {"message": "Seleccion de sucursal eliminada"}

def delete_correctivo(db_session: Session, id_cuadrilla: int, id_mantenimiento: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    correctivo = db_session.query(CorrectivoSeleccionado).filter(
        CorrectivoSeleccionado.id_cuadrilla == id_cuadrilla,
        CorrectivoSeleccionado.id_mantenimiento == id_mantenimiento
    ).first()
    if not correctivo:
        raise HTTPException(status_code=404, detail="Correctivo no encontrado")
        
    db_session.delete(correctivo)
    db_session.commit()
    return {"message": "Seleccion de correctivo eliminada"}

def delete_preventivo(db_session: Session, id_cuadrilla: int, id_mantenimiento: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
        
    preventivo = db_session.query(PreventivoSeleccionado).filter(
        PreventivoSeleccionado.id_cuadrilla == id_cuadrilla,
        PreventivoSeleccionado.id_mantenimiento == id_mantenimiento
    ).first()
    if not preventivo:
        raise HTTPException(status_code=404, detail="Preventivo no encontrado")

    db_session.delete(preventivo)
    db_session.commit()
    return {"message": "Seleccion de preventivo eliminada"}

def delete_selection(db_session: Session, id_cuadrilla: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    correctivos = db_session.query(CorrectivoSeleccionado).filter(CorrectivoSeleccionado.id_cuadrilla == id_cuadrilla).all()
    if correctivos:
        for correctivo in correctivos:
            db_session.delete(correctivo)
        
    preventivos = db_session.query(PreventivoSeleccionado).filter(PreventivoSeleccionado.id_cuadrilla == id_cuadrilla).all()
    if preventivos:
        for preventivo in preventivos:
            db_session.delete(preventivo)

    db_session.commit()
    return {"message": "Seleccion eliminada"}