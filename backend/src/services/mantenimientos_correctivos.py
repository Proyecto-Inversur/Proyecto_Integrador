from sqlalchemy.orm import Session
from api.models import MantenimientoCorrectivo, MantenimientoCorrectivoFoto, Sucursal, Cuadrilla
from fastapi import HTTPException, UploadFile
from datetime import date, datetime
from typing import Optional, List
from services.gcloud_storage import upload_file_to_gcloud, delete_file_in_folder
from services.google_sheets import append_correctivo, update_correctivo, delete_correctivo
from services.notificaciones import notify_user, notify_users_correctivo
import os

GOOGLE_CLOUD_BUCKET_NAME = os.getenv("GOOGLE_CLOUD_BUCKET_NAME")

def get_mantenimientos_correctivos(db: Session):
    return db.query(MantenimientoCorrectivo).all()

def get_mantenimiento_correctivo(db: Session, mantenimiento_id: int):
    mantenimiento = db.query(MantenimientoCorrectivo).filter(MantenimientoCorrectivo.id == mantenimiento_id).first()
    if not mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento correctivo no encontrado")
    return mantenimiento

async def create_mantenimiento_correctivo(db: Session, id_sucursal: int, id_cuadrilla: int, fecha_apertura: date, numero_caso: str, incidente: str, rubro: str, estado: str, prioridad: str, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    # Verifica si la sucursal existe
    sucursal = db.query(Sucursal).filter(Sucursal.id == id_sucursal).first()
    if not sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    
    if id_cuadrilla:
        # Verifica si la cuadrilla existe
        cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == id_cuadrilla).first()
        if not cuadrilla:
            raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
    
    db_mantenimiento = MantenimientoCorrectivo(
        id_sucursal=id_sucursal,
        id_cuadrilla=id_cuadrilla,
        fecha_apertura=fecha_apertura,
        numero_caso=numero_caso,
        incidente=incidente,
        rubro=rubro,
        estado=estado,
        prioridad=prioridad
    )
    db.add(db_mantenimiento)
    db.commit()
    db.refresh(db_mantenimiento)
    append_correctivo(db, db_mantenimiento)
    if cuadrilla is not None:
        # Notificar si es alta prioridad
        if prioridad == "Alta":
            notify_user(
                db_session=db,
                firebase_uid=cuadrilla.firebase_uid,
                id_mantenimiento=db_mantenimiento.id,
                mensaje=f"Nuevo correctivo asignado - Sucursal: {sucursal.nombre} | Incidente: {str(db_mantenimiento.incidente)} | Prioridad: {str(db_mantenimiento.prioridad)}",
                title="Nuevo correctivo urgente asignado",
                body=f"Sucursal: {sucursal.nombre} | Incidente: {str(db_mantenimiento.incidente)}"
            )
        await notify_users_correctivo(
            db_session=db,
            id_mantenimiento=db_mantenimiento.id,
            mensaje=f"Nuevo correctivo asignado - Sucursal: {sucursal.nombre} | Incidente: {str(db_mantenimiento.incidente)} | Prioridad: {str(db_mantenimiento.prioridad)}",
            firebase_uid=cuadrilla.firebase_uid
        )
    return db_mantenimiento

async def update_mantenimiento_correctivo(
    db: Session, 
    mantenimiento_id: int,
    current_entity: dict,
    id_sucursal: Optional[int] = None, 
    id_cuadrilla: Optional[int] = None, 
    fecha_apertura: Optional[date] = None, 
    fecha_cierre: Optional[date] = None, 
    numero_caso: Optional[str] = None, 
    incidente: Optional[str] = None, 
    rubro: Optional[str] = None, 
    planilla: Optional[UploadFile] = None, 
    fotos: Optional[List[UploadFile]] = None, 
    estado: Optional[str] = None, 
    prioridad: Optional[str] = None, 
    extendido: Optional[datetime] = None
):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    db_mantenimiento = db.query(MantenimientoCorrectivo).filter(MantenimientoCorrectivo.id == mantenimiento_id).first()
    if not db_mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento correctivo no encontrado")
    
    bucket_name = GOOGLE_CLOUD_BUCKET_NAME
    if not bucket_name:
        raise HTTPException(status_code=500, detail="Google Cloud Bucket name not configured")
    base_folder = f"mantenimientos_correctivos/{mantenimiento_id}"
    
    if id_sucursal:
        sucursal = db.query(Sucursal).filter(Sucursal.id == id_sucursal).first()
        if not sucursal:
            raise HTTPException(status_code=404, detail="Sucursal no encontrada")
        db_mantenimiento.id_sucursal = id_sucursal
    else:
        sucursal = db.query(Sucursal).filter(Sucursal.id == db_mantenimiento.id_sucursal).first()
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
    if numero_caso is not None:
        db_mantenimiento.numero_caso = numero_caso
    if incidente is not None:
        db_mantenimiento.incidente = incidente
    if rubro is not None:
        db_mantenimiento.rubro = rubro
    if planilla is not None:
        planilla_url = await upload_file_to_gcloud(planilla, bucket_name, f"{base_folder}/planilla")
        db_mantenimiento.planilla = planilla_url
    
    if fotos is not None:
        for foto in fotos:
            url = await upload_file_to_gcloud(foto, bucket_name, f"{base_folder}/fotos")
            new_foto = MantenimientoCorrectivoFoto(mantenimiento_id=mantenimiento_id, url=url)
            db.add(new_foto)
    
    if estado is not None:
        db_mantenimiento.estado = estado
        if estado != "Solucionado" and estado != "Finalizado":
            db_mantenimiento.fecha_cierre = None
        if estado == "Solucionado":
            await notify_users_correctivo(
                db_session=db,
                id_mantenimiento=mantenimiento_id,
                mensaje=f"Correctivo Solucionado - Sucursal: {sucursal.nombre} | Incidente: {str(db_mantenimiento.incidente)}",
                firebase_uid=None
            )
    if prioridad is not None:
        db_mantenimiento.prioridad = prioridad
    if extendido is not None:
        db_mantenimiento.extendido = extendido
        await notify_users_correctivo(
            db_session=db,
            id_mantenimiento=mantenimiento_id,
            mensaje=f"Extendido solicitado - Sucursal: {sucursal.nombre} | Cuadrilla: {cuadrilla.nombre}",
            firebase_uid=None
        )
    db.commit()
    db.refresh(db_mantenimiento)
    update_correctivo(db, db_mantenimiento)
    if cuadrilla is not None:
        # Notify only once after all updates
        if prioridad == "Alta":
            notify_user(
                db_session=db,
                firebase_uid=cuadrilla.firebase_uid,
                id_mantenimiento=db_mantenimiento.id,
                mensaje=f"Correctivo urgente asignado - Sucursal: {sucursal.nombre} | Incidente: {str(db_mantenimiento.incidente)} | Prioridad: {str(db_mantenimiento.prioridad)}",
                title="Correctivo urgente asignado",
                body=f"Sucursal: {sucursal.nombre} | Incidente: {str(db_mantenimiento.incidente)}"
            )
            await notify_users_correctivo(
                db_session=db,
                id_mantenimiento=db_mantenimiento.id,
                mensaje=f"Correctivo urgente asignado - Sucursal: {sucursal.nombre} | Incidente: {str(db_mantenimiento.incidente)} | Prioridad: {str(db_mantenimiento.prioridad)}",
                firebase_uid=cuadrilla.firebase_uid
            )
    return db_mantenimiento

def delete_mantenimiento_correctivo(db: Session, mantenimiento_id: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    db_mantenimiento = db.query(MantenimientoCorrectivo).filter(MantenimientoCorrectivo.id == mantenimiento_id).first()
    if not db_mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento correctivo no encontrado")
    db.delete(db_mantenimiento)
    db.commit()
    delete_correctivo(db, mantenimiento_id)
    return {"message": f"Mantenimiento correctivo con id {mantenimiento_id} eliminado"}

def delete_mantenimiento_planilla(db: Session, mantenimiento_id: int, file_name: str, current_entity: dict) -> bool:
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    db_mantenimiento = db.query(MantenimientoCorrectivo).filter(MantenimientoCorrectivo.id == mantenimiento_id).first()
    if not db_mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento correctivo no encontrado")
    
    delete_file_in_folder(GOOGLE_CLOUD_BUCKET_NAME, f"mantenimientos_correctivos/{mantenimiento_id}/planilla/", file_name)
    
    db_mantenimiento.planilla = None
    
    db.commit()
    db.refresh(db_mantenimiento)
    update_correctivo(db, db_mantenimiento)
    return True

def delete_mantenimiento_photo(db: Session, mantenimiento_id: int, file_name: str, current_entity: dict) -> bool:
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    db_mantenimiento = db.query(MantenimientoCorrectivo).filter(MantenimientoCorrectivo.id == mantenimiento_id).first()
    if not db_mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento correctivo no encontrado")
    
    foto = db.query(MantenimientoCorrectivoFoto).filter(
        MantenimientoCorrectivoFoto.mantenimiento_id == mantenimiento_id,
        MantenimientoCorrectivoFoto.url.endswith(file_name)
    ).first()
    if not foto:
        raise HTTPException(status_code=404, detail="Foto no encontrada")
    
    delete_file_in_folder(GOOGLE_CLOUD_BUCKET_NAME, f"mantenimientos_correctivos/{mantenimiento_id}/fotos/", file_name)
    db.delete(foto)
    db.commit()
    update_correctivo(db, db_mantenimiento)
    return True