from sqlalchemy.orm import Session
from api.models import Preventivo, Sucursal
from fastapi import HTTPException

def get_preventivos(db: Session):
    return db.query(Preventivo).all()

def get_preventivo(db: Session, preventivo_id: int):
    preventivo = db.query(Preventivo).filter(Preventivo.id == preventivo_id).first()
    if not preventivo:
        raise HTTPException(status_code=404, detail="Preventivo no encontrado")
    return preventivo

def create_preventivo(db: Session, id_sucursal: int, nombre_sucursal: str, frecuencia: str, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    existing_preventivo = db.query(Preventivo).filter(Preventivo.id_sucursal == id_sucursal).first()
    if existing_preventivo:
        raise HTTPException(status_code=400, detail="El preventivo ya existe")
    
    # Verifica si la sucursal existe
    sucursal = db.query(Sucursal).filter(Sucursal.id == id_sucursal).first()
    if not sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    
    db_preventivo = Preventivo(id_sucursal=id_sucursal, nombre_sucursal=nombre_sucursal, frecuencia=frecuencia)
    db.add(db_preventivo)
    db.commit()
    db.refresh(db_preventivo)
    return db_preventivo

def update_preventivo(db: Session, preventivo_id: int, current_entity: dict, id_sucursal: int = None, nombre_sucursal: str = None, frecuencia: str = None):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    db_preventivo = db.query(Preventivo).filter(Preventivo.id == preventivo_id).first()
    if not db_preventivo:
        raise HTTPException(status_code=404, detail="Preventivo no encontrado")
    
    if id_sucursal:
        sucursal = db.query(Sucursal).filter(Sucursal.id == id_sucursal).first()
        if not sucursal:
            raise HTTPException(status_code=404, detail="Sucursal no encontrada")
        db_preventivo.id_sucursal = id_sucursal
        db_preventivo.nombre_sucursal = nombre_sucursal
    if frecuencia:
        db_preventivo.frecuencia = frecuencia
    db.commit()
    db.refresh(db_preventivo)
    return db_preventivo

def delete_preventivo(db: Session, preventivo_id: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    db_preventivo = db.query(Preventivo).filter(Preventivo.id == preventivo_id).first()
    if not db_preventivo:
        raise HTTPException(status_code=404, detail="Preventivo no encontrado")
    db.delete(db_preventivo)
    db.commit()
    return {"message": f"Preventivo con id {preventivo_id} eliminado"}