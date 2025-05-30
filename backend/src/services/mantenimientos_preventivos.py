from sqlalchemy.orm import Session
from api.models import MantenimientoPreventivo, Preventivo, Cuadrilla
from fastapi import HTTPException, UploadFile
from datetime import date, datetime
from typing import Optional, List
from services.gcloud_storage import upload_files_to_gcloud
import os

def get_mantenimientos_preventivos(db: Session):
    return db.query(MantenimientoPreventivo).all()

def get_mantenimiento_preventivo(db: Session, mantenimiento_id: int):
    mantenimiento = db.query(MantenimientoPreventivo).filter(MantenimientoPreventivo.id == mantenimiento_id).first()
    if not mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento preventivo no encontrado")
    return mantenimiento

def create_mantenimiento_preventivo(db: Session, nombre_sucursal: str, frecuencia: str, id_cuadrilla: int, fecha_apertura: date):
    # Verifica si el preventivo existe
    preventivo = db.query(Preventivo).filter(Preventivo.nombre_sucursal == nombre_sucursal).first()
    if not preventivo:
        raise HTTPException(status_code=404, detail="Preventivo no encontrado")
    
    # Verifica si la cuadrilla existe
    cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == id_cuadrilla).first()
    if not cuadrilla:
        raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
    
    db_mantenimiento = MantenimientoPreventivo(
        nombre_sucursal=nombre_sucursal,
        frecuencia=frecuencia,
        id_cuadrilla=id_cuadrilla,
        fecha_apertura=fecha_apertura
    )
    db.add(db_mantenimiento)
    db.commit()
    db.refresh(db_mantenimiento)
    return db_mantenimiento

async def update_mantenimiento_preventivo(
    db: Session,
    mantenimiento_id: int,
    nombre_sucursal: Optional[str] = None,
    frecuencia: Optional[str] = None,
    id_cuadrilla: Optional[int] = None,
    fecha_apertura: Optional[date] = None,
    fecha_cierre: Optional[date] = None,
    planillas: Optional[List[UploadFile]] = None,
    fotos: Optional[List[UploadFile]] = None,
    extendido: Optional[datetime] = None
):
    db_mantenimiento = db.query(MantenimientoPreventivo).filter(MantenimientoPreventivo.id == mantenimiento_id).first()
    if not db_mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento preventivo no encontrado")
    
    bucket_name = os.getenv("GOOGLE_CLOUD_BUCKET_NAME")
    if not bucket_name:
        raise HTTPException(status_code=500, detail="Google Cloud Bucket name not configured")
    base_folder = f"mantenimientos_preventivos/{mantenimiento_id}"
    planillas_url = None
    fotos_url = None
    
    if nombre_sucursal:
        preventivo = db.query(Preventivo).filter(Preventivo.nombre_sucursal == nombre_sucursal).first()
        if not preventivo:
            raise HTTPException(status_code=404, detail="Preventivo no encontrado")
        db_mantenimiento.nombre_sucursal = nombre_sucursal
    if frecuencia is not None:
        db_mantenimiento.frecuencia = frecuencia
    if id_cuadrilla:
        cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == id_cuadrilla).first()
        if not cuadrilla:
            raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
        db_mantenimiento.id_cuadrilla = id_cuadrilla
    if fecha_apertura is not None:
        db_mantenimiento.fecha_apertura = fecha_apertura
    if fecha_cierre is not None:
        db_mantenimiento.fecha_cierre = fecha_cierre
    if planillas is not None:
        planillas_url = await upload_files_to_gcloud(planillas, bucket_name, f"{base_folder}/planillas")
        db_mantenimiento.planillas = planillas_url
    if fotos is not None:
        fotos_url = await upload_files_to_gcloud(fotos, bucket_name, f"{base_folder}/fotos")
        db_mantenimiento.fotos = fotos_url
    if extendido is not None:
        db_mantenimiento.extendido = extendido
    db.commit()
    db.refresh(db_mantenimiento)
    return db_mantenimiento

def delete_mantenimiento_preventivo(db: Session, mantenimiento_id: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    db_mantenimiento = db.query(MantenimientoPreventivo).filter(MantenimientoPreventivo.id == mantenimiento_id).first()
    if not db_mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento preventivo no encontrado")
    db.delete(db_mantenimiento)
    db.commit()
    return {"message": f"Mantenimiento preventivo con id {mantenimiento_id} eliminado"}