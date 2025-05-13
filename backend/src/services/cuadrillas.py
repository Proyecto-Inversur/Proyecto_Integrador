from sqlalchemy.orm import Session
from api.models import Cuadrilla
from fastapi import HTTPException

def get_cuadrillas(db: Session):
    return db.query(Cuadrilla).all()

def get_cuadrilla(db: Session, cuadrilla_id: int):
    cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == cuadrilla_id).first()
    if not cuadrilla:
        raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
    return cuadrilla