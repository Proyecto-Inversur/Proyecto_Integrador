from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from config.database import get_db
from services.preventivos import get_preventivos, get_preventivo, create_preventivo, update_preventivo, delete_preventivo
from api.schemas import PreventivoCreate, PreventivoUpdate
from typing import List

router = APIRouter(prefix="/preventivos", tags=["preventivos"])

@router.get("/", response_model=List[dict])
def preventivos_get(db: Session = Depends(get_db)):
    preventivos = get_preventivos(db)
    return [{"id": p.id, "id_sucursal": p.id_sucursal, "nombre_sucursal": p.nombre_sucursal, "frecuencia": p.frecuencia} for p in preventivos]

@router.get("/{preventivo_id}", response_model=dict)
def preventivo_get(preventivo_id: int, db: Session = Depends(get_db)):
    preventivo = get_preventivo(db, preventivo_id)
    return {"id": preventivo.id, "id_sucursal": preventivo.id_sucursal, "nombre_sucursal": preventivo.nombre_sucursal, "frecuencia": preventivo.frecuencia}

@router.post("/", response_model=dict)
def preventivo_create(preventivo: PreventivoCreate, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    new_preventivo = create_preventivo(db, preventivo.id_sucursal, preventivo.nombre_sucursal, preventivo.frecuencia, current_entity)
    return {"id": new_preventivo.id, "id_sucursal": new_preventivo.id_sucursal, "nombre_sucursal": new_preventivo.nombre_sucursal, "frecuencia": new_preventivo.frecuencia}

@router.put("/{preventivo_id}", response_model=dict)
def preventivo_update(preventivo_id: int, preventivo: PreventivoUpdate, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    updated_preventivo = update_preventivo(db, preventivo_id, current_entity, preventivo.id_sucursal, preventivo.nombre_sucursal, preventivo.frecuencia)
    return {"id": updated_preventivo.id, "id_sucursal": updated_preventivo.id_sucursal, "nombre_sucursal": updated_preventivo.nombre_sucursal, "frecuencia": updated_preventivo.frecuencia}

@router.delete("/{preventivo_id}", response_model=dict)
def preventivo_delete(preventivo_id: int, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    return delete_preventivo(db, preventivo_id, current_entity)