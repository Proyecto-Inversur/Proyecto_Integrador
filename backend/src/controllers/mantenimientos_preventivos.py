from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from config.database import get_db
from services.mantenimientos_preventivos import get_mantenimientos_preventivos, get_mantenimiento_preventivo, create_mantenimiento_preventivo, update_mantenimiento_preventivo, delete_mantenimiento_preventivo
from api.schemas import MantenimientoPreventivoCreate, MantenimientoPreventivoUpdate
from typing import List

router = APIRouter(prefix="/mantenimientos-preventivos", tags=["mantenimientos-preventivos"])

@router.get("/", response_model=List[dict])
def mantenimientos_preventivos_get(db: Session = Depends(get_db)):
    mantenimientos = get_mantenimientos_preventivos(db)
    return [
        {
            "id": m.id,
            "nombre_sucursal": m.nombre_sucursal,
            "frecuencia": m.frecuencia,
            "id_cuadrilla": m.id_cuadrilla,
            "fecha_apertura": m.fecha_apertura,
            "fecha_cierre": m.fecha_cierre,
            "planillas": m.planillas,
            "fotos": m.fotos,
            "extendido": m.extendido
        }
        for m in mantenimientos
    ]

@router.get("/{mantenimiento_id}", response_model=dict)
def mantenimiento_preventivo_get(mantenimiento_id: int, db: Session = Depends(get_db)):
    mantenimiento = get_mantenimiento_preventivo(db, mantenimiento_id)
    return {
        "id": mantenimiento.id,
        "nombre_sucursal": mantenimiento.nombre_sucursal,
        "frecuencia": mantenimiento.frecuencia,
        "id_cuadrilla": mantenimiento.id_cuadrilla,
        "fecha_apertura": mantenimiento.fecha_apertura,
        "fecha_cierre": mantenimiento.fecha_cierre,
        "planillas": mantenimiento.planillas,
        "fotos": mantenimiento.fotos,
        "extendido": mantenimiento.extendido
    }

@router.post("/", response_model=dict)
def mantenimiento_preventivo_create(mantenimiento: MantenimientoPreventivoCreate, db: Session = Depends(get_db)):
    new_mantenimiento = create_mantenimiento_preventivo(
        db,
        mantenimiento.nombre_sucursal,
        mantenimiento.frecuencia,
        mantenimiento.id_cuadrilla,
        mantenimiento.fecha_apertura
    )
    return {
        "id": new_mantenimiento.id,
        "nombre_sucursal": new_mantenimiento.nombre_sucursal,
        "frecuencia": new_mantenimiento.frecuencia,
        "id_cuadrilla": new_mantenimiento.id_cuadrilla,
        "fecha_apertura": new_mantenimiento.fecha_apertura
    }

@router.put("/{mantenimiento_id}", response_model=dict)
def mantenimiento_preventivo_update(mantenimiento_id: int, mantenimiento: MantenimientoPreventivoUpdate = Depends(), db: Session = Depends(get_db)):
    updated_mantenimiento = update_mantenimiento_preventivo(
        db,
        mantenimiento_id,
        mantenimiento.nombre_sucursal,
        mantenimiento.frecuencia,
        mantenimiento.id_cuadrilla,
        mantenimiento.fecha_apertura,
        mantenimiento.fecha_cierre,
        mantenimiento.planillas,
        mantenimiento.fotos,
        mantenimiento.extendido
    )
    return {
        "id": updated_mantenimiento.id,
        "nombre_sucursal": updated_mantenimiento.nombre_sucursal,
        "frecuencia": updated_mantenimiento.frecuencia,
        "id_cuadrilla": updated_mantenimiento.id_cuadrilla,
        "fecha_apertura": updated_mantenimiento.fecha_apertura,
        "fecha_cierre": updated_mantenimiento.fecha_cierre,
        "planillas": updated_mantenimiento.planillas,
        "fotos": updated_mantenimiento.fotos,
        "extendido": updated_mantenimiento.extendido
    }

@router.delete("/{mantenimiento_id}", response_model=dict)
def mantenimiento_preventivo_delete(mantenimiento_id: int, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    return delete_mantenimiento_preventivo(db, mantenimiento_id, current_entity)