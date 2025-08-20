from fastapi import APIRouter, Depends, Request, UploadFile, Form
from sqlalchemy.orm import Session
from config.database import get_db
from services.mantenimientos_correctivos import get_mantenimientos_correctivos, get_mantenimiento_correctivo, create_mantenimiento_correctivo, update_mantenimiento_correctivo, delete_mantenimiento_correctivo, delete_mantenimiento_planilla, delete_mantenimiento_photo
from api.schemas import MantenimientoCorrectivoCreate
from typing import List, Optional
from datetime import date, datetime

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
            "fotos": [foto.url for foto in m.fotos],
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
        "fotos": [foto.url for foto in mantenimiento.fotos],
        "estado": mantenimiento.estado,
        "prioridad": mantenimiento.prioridad,
        "extendido": mantenimiento.extendido
    }

@router.post("/", response_model=dict)
async def mantenimiento_correctivo_create(mantenimiento: MantenimientoCorrectivoCreate, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    new_mantenimiento = await create_mantenimiento_correctivo(
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
async def mantenimiento_correctivo_update(
    mantenimiento_id: int,
    request: Request,
    id_sucursal: Optional[int] = Form(None),
    id_cuadrilla: Optional[int] = Form(None),
    fecha_apertura: Optional[date] = Form(None),
    fecha_cierre: Optional[date] = Form(None),
    numero_caso: Optional[str] = Form(None),
    incidente: Optional[str] = Form(None),
    rubro: Optional[str] = Form(None),
    planilla: Optional[UploadFile] = None,
    fotos: Optional[List[UploadFile]] = None,
    estado: Optional[str] = Form(None),
    prioridad: Optional[str] = Form(None),
    extendido: Optional[datetime] = Form(None),
    db: Session = Depends(get_db)
):
    current_entity = request.state.current_entity
    updated_mantenimiento = await update_mantenimiento_correctivo(
        db,
        mantenimiento_id,
        current_entity,
        id_sucursal,
        id_cuadrilla,
        fecha_apertura,
        fecha_cierre,
        numero_caso,
        incidente,
        rubro,
        planilla,
        fotos,
        estado,
        prioridad,
        extendido
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
        "fotos": [foto.url for foto in updated_mantenimiento.fotos],
        "estado": updated_mantenimiento.estado,
        "prioridad": updated_mantenimiento.prioridad,
        "extendido": updated_mantenimiento.extendido
    }

@router.delete("/{mantenimiento_id}", response_model=dict)
def mantenimiento_correctivo_delete(mantenimiento_id: int, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    return delete_mantenimiento_correctivo(db, mantenimiento_id, current_entity)

@router.delete("/{mantenimiento_id}/planilla/{file_name}", response_model=dict)
def mantenimiento_planilla_delete(mantenimiento_id: int, file_name: str, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    delete_mantenimiento_planilla(db, mantenimiento_id, file_name, current_entity)
    return {"message": "Planilla eliminada correctamente"}

@router.delete("/{mantenimiento_id}/fotos/{file_name}", response_model=dict)
def mantenimiento_photo_delete(mantenimiento_id: int, file_name: str, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    delete_mantenimiento_photo(db, mantenimiento_id, file_name, current_entity)
    return {"message": "Foto eliminada correctamente"}