from sqlalchemy.orm import Session
from api.models import Sucursal
from fastapi import HTTPException
from firebase_admin import db
from auth.firebase import initialize_firebase

def get_sucursales(db_session: Session):
    return db_session.query(Sucursal).all()

def get_sucursal(db_session: Session, sucursal_id: int):
    sucursal = db_session.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
    if not sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    return sucursal

def create_sucursal(db_session: Session, nombre: str, zona: str, direccion: dict, superficie: str, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    if not isinstance(direccion, dict) or 'address' not in direccion:
        raise HTTPException(status_code=400, detail="El campo direccion debe ser un objeto con address, lat y lng")
    
    # Store in PostgreSQL
    try:
        db_sucursal = Sucursal(
            nombre=nombre,
            zona=zona,
            direccion=direccion.get('address', ''),
            superficie=superficie
        )
        db_session.add(db_sucursal)
        db_session.commit()
        db_session.refresh(db_sucursal)
    except Exception as e:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=f"Error guardando en PostgreSQL: {str(e)}")
    
    # Store in Firebase
    try:
        initialize_firebase()
        ref = db.reference(f'/sucursales/{db_sucursal.id}')
        ref.set({
            'name': nombre,
            'lat': direccion.get('lat', 0.0),
            'lng': direccion.get('lng', 0.0)
        })
    except Exception as e:
        db_session.delete(db_sucursal)  # Rollback PostgreSQL if Firebase fails
        db_session.commit()
        raise HTTPException(status_code=500, detail=f"Error guardando en Firebase: {str(e)}")
    
    return db_sucursal

def update_sucursal(db_session: Session, sucursal_id: int, current_entity: dict, nombre: str = None, zona: str = None, direccion: dict = None, superficie: str = None):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    db_sucursal = db_session.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
    if not db_sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    
    # Update PostgreSQL
    if nombre:
        db_sucursal.nombre = nombre
    if zona:
        db_sucursal.zona = zona
    if direccion and 'address' in direccion:
        db_sucursal.direccion = direccion['address']
    if superficie:
        db_sucursal.superficie = superficie
    db_session.commit()
    db_session.refresh(db_sucursal)
    
    # Update Firebase
    if nombre or (direccion and ('lat' in direccion or 'lng' in direccion)):
        try:
            initialize_firebase()
            ref = db.reference(f'/sucursales/{sucursal_id}')
            updates = {}
            if nombre:
                updates['name'] = nombre
            if direccion:
                if 'lat' in direccion:
                    updates['lat'] = direccion['lat']
                if 'lng' in direccion:
                    updates['lng'] = direccion['lng']
            ref.update(updates)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error actualizando en Firebase: {str(e)}")
    
    return db_sucursal

def delete_sucursal(db_session: Session, sucursal_id: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    db_sucursal = db_session.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
    if not db_sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    # Delete from PostgreSQL
    db_session.delete(db_sucursal)
    db_session.commit()
    
    # Delete from Firebase
    try:
        initialize_firebase()
        ref = db.reference(f'/sucursales/{sucursal_id}')
        ref.delete()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error eliminando de Firebase: {str(e)}")
    
    return {"message": f"Sucursal con id {sucursal_id} eliminada"}