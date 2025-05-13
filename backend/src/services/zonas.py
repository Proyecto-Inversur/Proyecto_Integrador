from sqlalchemy.orm import Session
from api.models import Zona, Sucursal, Cuadrilla
from fastapi import HTTPException

def get_zonas(db: Session):
    return db.query(Zona).all()

def create_zona(db: Session, nombre: str, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    existing_zona = db.query(Zona).filter(Zona.nombre == nombre).first()
    if existing_zona:
        raise HTTPException(status_code=400, detail="La zona ya existe")
    db_zona = Zona(nombre=nombre)
    db.add(db_zona)
    db.commit()
    db.refresh(db_zona)
    return db_zona

def delete_zona(db: Session, id: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    zona = db.query(Zona).filter(Zona.id == id).first()
    if not zona:
        raise HTTPException(status_code=404, detail="Zona no encontrada")
    # Verificar si la zona está en uso
    sucursales = db.query(Sucursal).filter(Sucursal.zona == zona.nombre).count()
    cuadrillas = db.query(Cuadrilla).filter(Cuadrilla.zona == zona.nombre).count()
    if sucursales > 0 or cuadrillas > 0:
        raise HTTPException(status_code=400, detail="No se puede eliminar la zona porque está en uso")
    db.delete(zona)
    db.commit()
    return {"message": "Zona eliminada"}