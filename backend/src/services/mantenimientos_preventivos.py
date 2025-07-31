from sqlalchemy.orm import Session
from api.models import MantenimientoPreventivo, MantenimientoPreventivoPlanilla, MantenimientoPreventivoFoto, Preventivo, Cuadrilla
from fastapi import HTTPException, UploadFile
from datetime import date, datetime
from typing import Optional, List
from services.gcloud_storage import upload_file_to_gcloud, delete_file_in_folder
from services.google_sheets import append_preventivo, update_preventivo, delete_preventivo
from services.notificaciones import notify_users_preventivo
import os

GOOGLE_CLOUD_BUCKET_NAME = os.getenv("GOOGLE_CLOUD_BUCKET_NAME")

def get_mantenimientos_preventivos(db: Session):
    return db.query(MantenimientoPreventivo).all()

def get_mantenimiento_preventivo(db: Session, mantenimiento_id: int):
    mantenimiento = db.query(MantenimientoPreventivo).filter(MantenimientoPreventivo.id == mantenimiento_id).first()
    if not mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento preventivo no encontrado")
    return mantenimiento

def create_mantenimiento_preventivo(db: Session, id_sucursal: int, frecuencia: str, id_cuadrilla: int, fecha_apertura: date, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    # Verifica si el preventivo existe
    preventivo = db.query(Preventivo).filter(Preventivo.id_sucursal == id_sucursal).first()
    if not preventivo:
        raise HTTPException(status_code=404, detail="Preventivo no encontrado")
    
    # Verifica si la cuadrilla existe
    cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == id_cuadrilla).first()
    if not cuadrilla:
        raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
    
    db_mantenimiento = MantenimientoPreventivo(
        id_sucursal=id_sucursal,
        frecuencia=frecuencia,
        id_cuadrilla=id_cuadrilla,
        fecha_apertura=fecha_apertura
    )
    db.add(db_mantenimiento)
    db.commit()
    db.refresh(db_mantenimiento)
    append_preventivo(db, db_mantenimiento)
    notify_users_preventivo(
        db_session=db,
        id_mantenimiento=db_mantenimiento.id,
        mensaje=f"Nuevo preventivo asignado - Sucursal: {preventivo.nombre_sucursal}",
        firebase_uid=cuadrilla.firebase_uid, 
    )
    return db_mantenimiento

async def update_mantenimiento_preventivo(
    db: Session,
    mantenimiento_id: int,
    current_entity: dict,
    id_sucursal: Optional[int] = None,
    frecuencia: Optional[str] = None,
    id_cuadrilla: Optional[int] = None,
    fecha_apertura: Optional[date] = None,
    fecha_cierre: Optional[date] = None,
    planillas: Optional[List[UploadFile]] = None,
    fotos: Optional[List[UploadFile]] = None,
    extendido: Optional[datetime] = None
):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    db_mantenimiento = db.query(MantenimientoPreventivo).filter(MantenimientoPreventivo.id == mantenimiento_id).first()
    if not db_mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento preventivo no encontrado")
    
    bucket_name = GOOGLE_CLOUD_BUCKET_NAME
    if not bucket_name:
        raise HTTPException(status_code=500, detail="Google Cloud Bucket name not configured")
    base_folder = f"mantenimientos_preventivos/{mantenimiento_id}"
    
    if id_sucursal:
        preventivo = db.query(Preventivo).filter(Preventivo.id_sucursal == id_sucursal).first()
        if not preventivo:
            raise HTTPException(status_code=404, detail="Preventivo no encontrado")
        db_mantenimiento.id_sucursal = id_sucursal
    else:
        preventivo = db.query(Preventivo).filter(Preventivo.id_sucursal == db_mantenimiento.id_sucursal).first()
    if frecuencia is not None:
        db_mantenimiento.frecuencia = frecuencia
    if id_cuadrilla:
        cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == id_cuadrilla).first()
        if not cuadrilla:
            raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
        db_mantenimiento.id_cuadrilla = id_cuadrilla
    else:
        cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == db_mantenimiento.id_cuadrilla).first() 
    if fecha_apertura is not None:
        db_mantenimiento.fecha_apertura = fecha_apertura
    if fecha_cierre is not None:
        db_mantenimiento.fecha_cierre = fecha_cierre
        notify_users_preventivo(
            db_session=db,
            id_mantenimiento=db_mantenimiento.id,
            mensaje=f"Preventivo Solucionado - Sucursal: {preventivo.nombre_sucursal}",
            firebase_uid=None
        )
    
    if planillas is not None:
        for planilla in planillas:
            url = await upload_file_to_gcloud(planilla, bucket_name, f"{base_folder}/planillas")
            new_planilla = MantenimientoPreventivoPlanilla(mantenimiento_id=mantenimiento_id, url=url)
            db.add(new_planilla)

    if fotos is not None:
        for foto in fotos:
            url = await upload_file_to_gcloud(foto, bucket_name, f"{base_folder}/fotos")
            new_foto = MantenimientoPreventivoFoto(mantenimiento_id=mantenimiento_id, url=url)
            db.add(new_foto)
    
    if extendido is not None:
        db_mantenimiento.extendido = extendido
        notify_users_preventivo(
            db_session=db,
            id_mantenimiento=mantenimiento_id,
            mensaje=f"Extendido solicitado - Sucursal: {preventivo.nombre_sucursal} | Cuadrilla: {cuadrilla.nombre}",
            firebase_uid=None
        )
    db.commit()
    db.refresh(db_mantenimiento)
    update_preventivo(db, db_mantenimiento)
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
    delete_preventivo(db, mantenimiento_id)
    return {"message": f"Mantenimiento preventivo con id {mantenimiento_id} eliminado"}

def delete_mantenimiento_planilla(db: Session, mantenimiento_id: int, file_name: str, current_entity: dict) -> bool:
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    db_mantenimiento = db.query(MantenimientoPreventivo).filter(MantenimientoPreventivo.id == mantenimiento_id).first()
    if not db_mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento preventivo no encontrado")
    
    planilla = db.query(MantenimientoPreventivoPlanilla).filter(
        MantenimientoPreventivoPlanilla.mantenimiento_id == mantenimiento_id,
        MantenimientoPreventivoPlanilla.url.endswith(file_name)
    ).first()
    if not planilla:
        raise HTTPException(status_code=404, detail="Planilla no encontrada")
    
    delete_file_in_folder(GOOGLE_CLOUD_BUCKET_NAME, f"mantenimientos_preventivos/{mantenimiento_id}/planillas/", file_name)
    db.delete(planilla)
    db.commit()
    update_preventivo(db, db_mantenimiento)
    return True
    
def delete_mantenimiento_photo(db: Session, mantenimiento_id: int, file_name: str, current_entity: dict) -> bool:
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    db_mantenimiento = db.query(MantenimientoPreventivo).filter(MantenimientoPreventivo.id == mantenimiento_id).first()
    if not db_mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento preventivo no encontrado")
    
    foto = db.query(MantenimientoPreventivoFoto).filter(
        MantenimientoPreventivoFoto.mantenimiento_id == mantenimiento_id,
        MantenimientoPreventivoFoto.url.endswith(file_name)
    ).first()
    if not foto:
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    
    delete_file_in_folder(GOOGLE_CLOUD_BUCKET_NAME, f"mantenimientos_preventivos/{mantenimiento_id}/fotos/", file_name)
    db.delete(foto)
    db.commit()
    update_preventivo(db, db_mantenimiento)
    return True