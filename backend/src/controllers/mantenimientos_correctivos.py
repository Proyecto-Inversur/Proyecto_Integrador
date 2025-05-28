from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from config.database import get_db
from services.mantenimientos_correctivos import get_mantenimientos_correctivos, get_mantenimiento_correctivo, create_mantenimiento_correctivo, update_mantenimiento_correctivo, delete_mantenimiento_correctivo
from api.schemas import MantenimientoCorrectivoCreate, MantenimientoCorrectivoUpdate
from typing import List

router = APIRouter(prefix="/mantenimientos-correctivos", tags=["mantenimientos-correctivos"])

@router.get("/", response_model=List[dict])
def mantenimientos_correctivos_get(db: Session = Depends(get_db)):
    mantenimientos = get_mantenimientos_correctivos(db)
    return [
        {
            "id": m.id,
            "id_sucursal": m.id_sucursal,
            "id_cuadrilla": m.id_cuadrilla,
            "fecha_apertura": m.fecha_apertura,
            "fecha_cierre": m.fecha_cierre,
            "numero_caso": m.numero_caso,
            "incidente": m.incidente,
            "rubro": m.rubro,
            "planilla": m.planilla,
            "fotos": m.fotos,
            "estado": m.estado,
            "prioridad": m.prioridad,
            "extendido": m.extendido
        }
        for m in mantenimientos
    ]

@router.get("/{mantenimiento_id}", response_model=dict)
def mantenimiento_correctivo_get(mantenimiento_id: int, db: Session = Depends(get_db)):
    mantenimiento = get_mantenimiento_correctivo(db, mantenimiento_id)
    return {
        "id": mantenimiento.id,
        "id_sucursal": mantenimiento.id_sucursal,
        "id_cuadrilla": mantenimiento.id_cuadrilla,
        "fecha_apertura": mantenimiento.fecha_apertura,
        "fecha_cierre": mantenimiento.fecha_cierre,
        "numero_caso": mantenimiento.numero_caso,
        "incidente": mantenimiento.incidente,
        "rubro": mantenimiento.rubro,
        "planilla": mantenimiento.planilla,
        "fotos": mantenimiento.fotos,
        "estado": mantenimiento.estado,
        "prioridad": mantenimiento.prioridad,
        "extendido": mantenimiento.extendido
    }

@router.post("/", response_model=dict)
def mantenimiento_correctivo_create(mantenimiento: MantenimientoCorrectivoCreate, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    new_mantenimiento = create_mantenimiento_correctivo(
        db,
        mantenimiento.id_sucursal,
        mantenimiento.id_cuadrilla,
        mantenimiento.fecha_apertura,
        mantenimiento.numero_caso,
        mantenimiento.incidente,
        mantenimiento.rubro,
        mantenimiento.estado,
        mantenimiento.prioridad,
        current_entity
    )
    return {
        "id": new_mantenimiento.id,
        "id_sucursal": new_mantenimiento.id_sucursal,
        "id_cuadrilla": new_mantenimiento.id_cuadrilla,
        "fecha_apertura": new_mantenimiento.fecha_apertura,
        "numero_caso": new_mantenimiento.numero_caso,
        "incidente": new_mantenimiento.incidente,
        "rubro": new_mantenimiento.rubro,
        "estado": new_mantenimiento.estado,
        "prioridad": new_mantenimiento.prioridad
    }

@router.put("/{mantenimiento_id}", response_model=dict)
def mantenimiento_correctivo_update(mantenimiento_id: int, mantenimiento: MantenimientoCorrectivoUpdate, db: Session = Depends(get_db)):
    updated_mantenimiento = update_mantenimiento_correctivo(
        db,
        mantenimiento_id,
        mantenimiento.id_sucursal,
        mantenimiento.id_cuadrilla,
        mantenimiento.fecha_apertura,
        mantenimiento.fecha_cierre,
        mantenimiento.numero_caso,
        mantenimiento.incidente,
        mantenimiento.rubro,
        mantenimiento.planilla,
        mantenimiento.fotos,
        mantenimiento.estado,
        mantenimiento.prioridad,
        mantenimiento.extendido
    )
    return {
        "id": updated_mantenimiento.id,
        "id_sucursal": updated_mantenimiento.id_sucursal,
        "id_cuadrilla": updated_mantenimiento.id_cuadrilla,
        "fecha_apertura": updated_mantenimiento.fecha_apertura,
        "fecha_cierre": updated_mantenimiento.fecha_cierre,
        "numero_caso": updated_mantenimiento.numero_caso,
        "incidente": updated_mantenimiento.incidente,
        "rubro": updated_mantenimiento.rubro,
        "planilla": updated_mantenimiento.planilla,
        "fotos": updated_mantenimiento.fotos,
        "estado": updated_mantenimiento.estado,
        "prioridad": updated_mantenimiento.prioridad,
        "extendido": updated_mantenimiento.extendido
    }

@router.delete("/{mantenimiento_id}", response_model=dict)
def mantenimiento_correctivo_delete(mantenimiento_id: int, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    return delete_mantenimiento_correctivo(db, mantenimiento_id, current_entity)