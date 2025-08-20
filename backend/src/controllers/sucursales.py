from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from config.database import get_db
from services.sucursales import get_sucursales, get_sucursal, create_sucursal, update_sucursal, delete_sucursal
from api.schemas import SucursalCreate, SucursalUpdate
from typing import List

router = APIRouter(prefix="/sucursales", tags=["sucursales"])

@router.get("/", response_model=List[dict])
def sucursales_get(db: Session = Depends(get_db)):
    sucursales = get_sucursales(db)
    return [{"id": s.id, "nombre": s.nombre, "zona": s.zona, "direccion": s.direccion, "superficie": s.superficie} for s in sucursales]

@router.get("/{sucursal_id}", response_model=dict)
def sucursal_get(sucursal_id: int, db: Session = Depends(get_db)):
    sucursal = get_sucursal(db, sucursal_id)
    return {"id": sucursal.id, "nombre": sucursal.nombre, "zona": sucursal.zona, "direccion": sucursal.direccion, "superficie": sucursal.superficie}

@router.post("/", response_model=dict)
def sucursal_create(sucursal: SucursalCreate, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    new_sucursal = create_sucursal(db, sucursal.nombre, sucursal.zona, sucursal.direccion, sucursal.superficie, current_entity)
    return {"id": new_sucursal.id, "nombre": new_sucursal.nombre, "zona": new_sucursal.zona, "direccion": new_sucursal.direccion, "superficie": new_sucursal.superficie}

@router.put("/{sucursal_id}", response_model=dict)
def sucursal_update(sucursal_id: int, sucursal: SucursalUpdate, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    updated_sucursal = update_sucursal(db, sucursal_id, current_entity, sucursal.nombre, sucursal.zona, sucursal.direccion, sucursal.superficie)
    return {"id": updated_sucursal.id, "nombre": updated_sucursal.nombre, "zona": updated_sucursal.zona, "direccion": updated_sucursal.direccion, "superficie": updated_sucursal.superficie}

@router.delete("/{sucursal_id}", response_model=dict)
def sucursal_delete(sucursal_id: int, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    return delete_sucursal(db, sucursal_id, current_entity)