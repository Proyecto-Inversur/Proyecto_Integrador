from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from config.database import get_db
from services.zonas import get_zonas, create_zona, delete_zona
from api.schemas import Zona
from typing import List

router = APIRouter(prefix="/zonas", tags=["zonas"])

# Endpoints
@router.get("/", response_model=List[dict])
def zonas_get(db: Session = Depends(get_db)):
    zonas = get_zonas(db)
    return [{"id": z.id, "nombre": z.nombre} for z in zonas]

@router.post("/", response_model=dict)
def zona_create(zona: Zona, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    new_zona = create_zona(db, zona.nombre, current_entity)
    return {"id": new_zona.id, "nombre": new_zona.nombre}

@router.delete("/{id}", response_model=dict)
def zona_delete(id: int, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    return delete_zona(db, id, current_entity)