from fastapi import APIRouter, Depends, Request, UploadFile, Form
from sqlalchemy.orm import Session
from config.database import get_db
from services.mantenimientos_preventivos import get_mantenimientos_preventivos, get_mantenimiento_preventivo, create_mantenimiento_preventivo, update_mantenimiento_preventivo, delete_mantenimiento_preventivo, delete_mantenimiento_planilla, delete_mantenimiento_photo
from api.schemas import MantenimientoPreventivoCreate
from typing import List, Optional
from datetime import date, datetime

router = APIRouter(prefix="/mantenimientos-preventivos", tags=["mantenimientos-preventivos"])

@router.get("/", response_model=List[dict])
def mantenimientos_preventivos_get(db: Session = Depends(get_db)):
    mantenimientos = get_mantenimientos_preventivos(db)
    return [
        {
            "id": m.id,
            "id_sucursal": m.id_sucursal,
            "frecuencia": m.frecuencia,
            "id_cuadrilla": m.id_cuadrilla,
            "fecha_apertura": m.fecha_apertura,
            "fecha_cierre": m.fecha_cierre,
            "planillas": [planilla.url for planilla in m.planillas],
            "fotos": [foto.url for foto in m.fotos],
            "extendido": m.extendido
        }
        for m in mantenimientos
    ]

@router.get("/{mantenimiento_id}", response_model=dict)
def mantenimiento_preventivo_get(mantenimiento_id: int, db: Session = Depends(get_db)):
    mantenimiento = get_mantenimiento_preventivo(db, mantenimiento_id)
    return {
        "id": mantenimiento.id,
        "id_sucursal": mantenimiento.id_sucursal,
        "frecuencia": mantenimiento.frecuencia,
        "id_cuadrilla": mantenimiento.id_cuadrilla,
        "fecha_apertura": mantenimiento.fecha_apertura,
        "fecha_cierre": mantenimiento.fecha_cierre,
        "planillas": [planilla.url for planilla in mantenimiento.planillas],
        "fotos": [foto.url for foto in mantenimiento.fotos],
        "extendido": mantenimiento.extendido
    }

@router.post("/", response_model=dict)
async def mantenimiento_preventivo_create(mantenimiento: MantenimientoPreventivoCreate, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    new_mantenimiento = await create_mantenimiento_preventivo(
        db,
        mantenimiento.id_sucursal,
        mantenimiento.frecuencia,
        mantenimiento.id_cuadrilla,
        mantenimiento.fecha_apertura,
        current_entity
    )
    return {
        "id": new_mantenimiento.id,
        "id_sucursal": new_mantenimiento.id_sucursal,
        "frecuencia": new_mantenimiento.frecuencia,
        "id_cuadrilla": new_mantenimiento.id_cuadrilla,
        "fecha_apertura": new_mantenimiento.fecha_apertura
    }

@router.put("/{mantenimiento_id}", response_model=dict)
async def mantenimiento_preventivo_update(
    mantenimiento_id: int,
    request: Request,
    id_sucursal: Optional[int] = Form(None),
    frecuencia: Optional[str] = Form(None),
    id_cuadrilla: Optional[int] = Form(None),
    fecha_apertura: Optional[date] = Form(None),
    fecha_cierre: Optional[date] = Form(None),
    planillas: Optional[List[UploadFile]] = None,
    fotos: Optional[List[UploadFile]] = None,
    extendido: Optional[datetime] = Form(None),
    db: Session = Depends(get_db)
):
    current_entity = request.state.current_entity
    updated_mantenimiento = await update_mantenimiento_preventivo(
        db,
        mantenimiento_id,
        current_entity,
        id_sucursal,
        frecuencia,
        id_cuadrilla,
        fecha_apertura,
        fecha_cierre,
        planillas,
        fotos,
        extendido
    )
    return {
        "id": updated_mantenimiento.id,
        "id_sucursal": updated_mantenimiento.id_sucursal,
        "frecuencia": updated_mantenimiento.frecuencia,
        "id_cuadrilla": updated_mantenimiento.id_cuadrilla,
        "fecha_apertura": updated_mantenimiento.fecha_apertura,
        "fecha_cierre": updated_mantenimiento.fecha_cierre,
        "planillas": [planilla.url for planilla in updated_mantenimiento.planillas],
        "fotos": [foto.url for foto in updated_mantenimiento.fotos],
        "extendido": updated_mantenimiento.extendido
    }

@router.delete("/{mantenimiento_id}", response_model=dict)
def mantenimiento_preventivo_delete(mantenimiento_id: int, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    return delete_mantenimiento_preventivo(db, mantenimiento_id, current_entity)

@router.delete("/{mantenimiento_id}/planillas/{file_name}", response_model=dict)
def mantenimiento_planillas_delete(mantenimiento_id: int, file_name: str, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    delete_mantenimiento_planilla(db, mantenimiento_id, file_name, current_entity)
    return {"message": "Planilla eliminada correctamente"}

@router.delete("/{mantenimiento_id}/fotos/{file_name}", response_model=dict)
def mantenimiento_photo_delete(mantenimiento_id: int, file_name: str, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    delete_mantenimiento_photo(db, mantenimiento_id, file_name, current_entity)
    return {"message": "Foto eliminada correctamente"}