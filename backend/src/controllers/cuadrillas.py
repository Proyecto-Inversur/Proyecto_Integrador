from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from config.database import get_db
from services.cuadrillas import get_cuadrillas, get_cuadrilla
from typing import List

router = APIRouter(prefix="/cuadrillas", tags=["cuadrillas"])

@router.get("/", response_model=List[dict])
async def cuadrillas_get(db: Session = Depends(get_db)):
    cuadrillas = get_cuadrillas(db)
    return [{"id": c.id, "nombre": c.nombre, "zona": c.zona, "email": c.email} for c in cuadrillas]

@router.get("/{cuadrilla_id}", response_model=dict)
async def cuadrilla_get(cuadrilla_id: int, db: Session = Depends(get_db)):
    cuadrilla = get_cuadrilla(db, cuadrilla_id)
    return {"id": cuadrilla.id, "nombre": cuadrilla.nombre, "zona": cuadrilla.zona, "email": cuadrilla.email}