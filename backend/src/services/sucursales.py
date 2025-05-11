from sqlalchemy.orm import Session
from api.models import Sucursal
from fastapi import HTTPException

def get_sucursales(db: Session):
    return db.query(Sucursal).all()

def get_sucursal(db: Session, sucursal_id: int):
    sucursal = db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
    if not sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    return sucursal

def create_sucursal(db: Session, nombre: str, zona: str, direccion: str, superficie: str, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    db_sucursal = Sucursal(nombre=nombre, zona=zona, direccion=direccion, superficie=superficie)
    db.add(db_sucursal)
    db.commit()
    db.refresh(db_sucursal)
    return db_sucursal

def update_sucursal(db: Session, sucursal_id: int, nombre: str = None, zona: str = None, direccion: str = None, superficie: str = None, current_entity: dict = None):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    db_sucursal = db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
    if not db_sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    
    if nombre:
        db_sucursal.nombre = nombre
    if zona:
        db_sucursal.zona = zona
    if direccion:
        db_sucursal.direccion = direccion
    if superficie:
        db_sucursal.superficie = superficie
    db.commit()
    db.refresh(db_sucursal)
    return db_sucursal

def delete_sucursal(db: Session, sucursal_id: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    db_sucursal = db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
    if not db_sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    db.delete(db_sucursal)
    db.commit()
    return {"message": f"Sucursal con id {sucursal_id} eliminada"}