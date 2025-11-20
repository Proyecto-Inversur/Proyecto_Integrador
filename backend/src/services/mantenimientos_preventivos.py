from calendar import monthrange
from datetime import date, datetime
from typing import List, Optional, Tuple
import os

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from api.models import (
    Cliente,
    Cuadrilla,
    MantenimientoPreventivo,
    MantenimientoPreventivoFoto,
    MantenimientoPreventivoPlanilla,
    Sucursal,
)
from services.gcloud_storage import delete_file_in_folder, upload_file_to_gcloud
from services.google_sheets import append_preventivo, delete_preventivo, update_preventivo
from services.notificaciones import notify_users_preventivo

GOOGLE_CLOUD_BUCKET_NAME = os.getenv("GOOGLE_CLOUD_BUCKET_NAME")
FRECUENCIA_PERIODOS = {
    "mensual": 1,
    "trimestral": 3,
    "cuatrimestral": 4,
    "semestral": 6,
}


def _ensure_usuario(current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity.get("type") != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")


def _get_cliente(db: Session, cliente_id: int) -> Cliente:
    cliente = db.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


def _get_sucursal(db: Session, sucursal_id: int) -> Sucursal:
    sucursal = db.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
    if not sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    return sucursal


def _get_cuadrilla(db: Session, cuadrilla_id: int) -> Cuadrilla:
    cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == cuadrilla_id).first()
    if not cuadrilla:
        raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
    return cuadrilla


def _ensure_cliente_sucursal(cliente_id: int, sucursal: Sucursal):
    if sucursal.cliente_id != cliente_id:
        raise HTTPException(status_code=400, detail="La sucursal no pertenece al cliente seleccionado")


def _normalize_frecuencia(frecuencia: str) -> str:
    freq = frecuencia.lower()
    if freq not in FRECUENCIA_PERIODOS:
        raise HTTPException(status_code=400, detail="Frecuencia de preventivo inválida")
    return freq


def _calculate_period_range(fecha: date, frecuencia: str) -> Tuple[date, date]:
    freq_key = _normalize_frecuencia(frecuencia)
    months = FRECUENCIA_PERIODOS[freq_key]
    start_month = ((fecha.month - 1) // months) * months + 1
    start_year = fecha.year
    start_date = date(start_year, start_month, 1)

    end_month = start_month + months - 1
    end_year = start_year
    while end_month > 12:
        end_month -= 12
        end_year += 1
    end_day = monthrange(end_year, end_month)[1]
    end_date = date(end_year, end_month, end_day)
    return start_date, end_date


def _ensure_preventivo_period(
    db: Session,
    sucursal_id: int,
    fecha: date,
    frecuencia: str,
    exclude_id: Optional[int] = None,
):
    inicio, fin = _calculate_period_range(fecha, frecuencia)
    query = db.query(MantenimientoPreventivo).filter(
        MantenimientoPreventivo.sucursal_id == sucursal_id,
        MantenimientoPreventivo.fecha_apertura >= inicio,
        MantenimientoPreventivo.fecha_apertura <= fin,
    )
    if exclude_id:
        query = query.filter(MantenimientoPreventivo.id != exclude_id)
    existe = query.first()
    if existe:
        raise HTTPException(
            status_code=400,
            detail="Ya existe un mantenimiento preventivo para esta sucursal en el período correspondiente a su frecuencia",
        )


def get_mantenimientos_preventivos(db: Session):
    return db.query(MantenimientoPreventivo).all()


def get_mantenimiento_preventivo(db: Session, mantenimiento_id: int):
    mantenimiento = db.query(MantenimientoPreventivo).filter(MantenimientoPreventivo.id == mantenimiento_id).first()
    if not mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento preventivo no encontrado")
    return mantenimiento


async def create_mantenimiento_preventivo(
    db: Session,
    cliente_id: int,
    sucursal_id: int,
    frecuencia: str,
    id_cuadrilla: int,
    fecha_apertura: date,
    estado: str,
    current_entity: dict,
):
    _ensure_usuario(current_entity)

    cliente = _get_cliente(db, cliente_id)
    sucursal = _get_sucursal(db, sucursal_id)
    _ensure_cliente_sucursal(cliente.id, sucursal)

    if not sucursal.frecuencia_preventivo:
        raise HTTPException(status_code=400, detail="La sucursal no tiene mantenimiento preventivo configurado")

    sucursal_frecuencia = sucursal.frecuencia_preventivo
    if frecuencia and frecuencia.lower() != sucursal_frecuencia.lower():
        raise HTTPException(
            status_code=400,
            detail="La frecuencia seleccionada no coincide con la configuración de la sucursal",
        )

    _ensure_preventivo_period(db, sucursal.id, fecha_apertura, sucursal_frecuencia)
    cuadrilla = _get_cuadrilla(db, id_cuadrilla)

    db_mantenimiento = MantenimientoPreventivo(
        cliente_id=cliente_id,
        sucursal_id=sucursal_id,
        frecuencia=sucursal_frecuencia,
        id_cuadrilla=id_cuadrilla,
        fecha_apertura=fecha_apertura,
        estado=estado,
    )
    db.add(db_mantenimiento)
    db.commit()
    db.refresh(db_mantenimiento)
    append_preventivo(db_mantenimiento)
    await notify_users_preventivo(
        db_session=db,
        id_mantenimiento=db_mantenimiento.id,
        mensaje=f"Nuevo preventivo asignado - Sucursal: {sucursal.nombre}",
        firebase_uid=cuadrilla.firebase_uid,
    )
    return db_mantenimiento


async def update_mantenimiento_preventivo(
    db: Session,
    mantenimiento_id: int,
    current_entity: dict,
    cliente_id: Optional[int] = None,
    sucursal_id: Optional[int] = None,
    frecuencia: Optional[str] = None,
    id_cuadrilla: Optional[int] = None,
    fecha_apertura: Optional[date] = None,
    fecha_cierre: Optional[date] = None,
    planillas: Optional[List[UploadFile]] = None,
    fotos: Optional[List[UploadFile]] = None,
    extendido: Optional[datetime] = None,
    estado: Optional[str] = None,
):
    _ensure_usuario(current_entity)

    db_mantenimiento = get_mantenimiento_preventivo(db, mantenimiento_id)

    bucket_name = GOOGLE_CLOUD_BUCKET_NAME
    if not bucket_name:
        raise HTTPException(status_code=500, detail="Google Cloud Bucket name not configured")
    base_folder = f"mantenimientos_preventivos/{mantenimiento_id}"

    final_cliente_id = cliente_id if cliente_id is not None else db_mantenimiento.cliente_id
    final_sucursal_id = sucursal_id if sucursal_id is not None else db_mantenimiento.sucursal_id

    cliente = _get_cliente(db, final_cliente_id)
    sucursal = _get_sucursal(db, final_sucursal_id)
    _ensure_cliente_sucursal(cliente.id, sucursal)

    if not sucursal.frecuencia_preventivo:
        raise HTTPException(status_code=400, detail="La sucursal no tiene mantenimiento preventivo configurado")

    if frecuencia and frecuencia.lower() != sucursal.frecuencia_preventivo.lower():
        raise HTTPException(
            status_code=400,
            detail="La frecuencia seleccionada no coincide con la configuración de la sucursal",
        )

    nueva_fecha_apertura = fecha_apertura or db_mantenimiento.fecha_apertura
    _ensure_preventivo_period(
        db,
        sucursal.id,
        nueva_fecha_apertura,
        sucursal.frecuencia_preventivo,
        exclude_id=db_mantenimiento.id,
    )

    db_mantenimiento.cliente_id = cliente.id
    db_mantenimiento.sucursal_id = sucursal.id
    db_mantenimiento.frecuencia = sucursal.frecuencia_preventivo

    if fecha_apertura is not None:
        db_mantenimiento.fecha_apertura = fecha_apertura
    if id_cuadrilla:
        cuadrilla = _get_cuadrilla(db, id_cuadrilla)
        db_mantenimiento.id_cuadrilla = id_cuadrilla
    else:
        cuadrilla = _get_cuadrilla(db, db_mantenimiento.id_cuadrilla)

    if fecha_cierre is not None:
        if fecha_cierre == date(1, 1, 1):
            db_mantenimiento.fecha_cierre = None
        else:
            db_mantenimiento.fecha_cierre = fecha_cierre
            await notify_users_preventivo(
                db_session=db,
                id_mantenimiento=db_mantenimiento.id,
                mensaje=f"Preventivo Solucionado - Sucursal: {sucursal.nombre}",
                firebase_uid=None,
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
        await notify_users_preventivo(
            db_session=db,
            id_mantenimiento=mantenimiento_id,
            mensaje=f"Extendido solicitado - Sucursal: {sucursal.nombre} | Cuadrilla: {cuadrilla.nombre}",
            firebase_uid=None,
        )

    if estado is not None:
        db_mantenimiento.estado = estado

    db.commit()
    db.refresh(db_mantenimiento)
    update_preventivo(db_mantenimiento)
    return db_mantenimiento


def delete_mantenimiento_preventivo(db: Session, mantenimiento_id: int, current_entity: dict):
    _ensure_usuario(current_entity)

    db_mantenimiento = get_mantenimiento_preventivo(db, mantenimiento_id)
    db.delete(db_mantenimiento)
    db.commit()
    delete_preventivo(mantenimiento_id)
    return {"message": f"Mantenimiento preventivo con id {mantenimiento_id} eliminado"}


def delete_mantenimiento_planilla(db: Session, mantenimiento_id: int, file_name: str, current_entity: dict) -> bool:
    _ensure_usuario(current_entity)

    db_mantenimiento = get_mantenimiento_preventivo(db, mantenimiento_id)

    planilla = (
        db.query(MantenimientoPreventivoPlanilla)
        .filter(
            MantenimientoPreventivoPlanilla.mantenimiento_id == mantenimiento_id,
            MantenimientoPreventivoPlanilla.url.endswith(file_name),
        )
        .first()
    )
    if not planilla:
        raise HTTPException(status_code=404, detail="Planilla no encontrada")

    delete_file_in_folder(GOOGLE_CLOUD_BUCKET_NAME, f"mantenimientos_preventivos/{mantenimiento_id}/planillas/", file_name)
    db.delete(planilla)
    db.commit()
    update_preventivo(db_mantenimiento)
    return True


def delete_mantenimiento_photo(db: Session, mantenimiento_id: int, file_name: str, current_entity: dict) -> bool:
    _ensure_usuario(current_entity)

    db_mantenimiento = get_mantenimiento_preventivo(db, mantenimiento_id)

    foto = (
        db.query(MantenimientoPreventivoFoto)
        .filter(
            MantenimientoPreventivoFoto.mantenimiento_id == mantenimiento_id,
            MantenimientoPreventivoFoto.url.endswith(file_name),
        )
        .first()
    )
    if not foto:
        raise HTTPException(status_code=404, detail="Foto no encontrada")

    delete_file_in_folder(GOOGLE_CLOUD_BUCKET_NAME, f"mantenimientos_preventivos/{mantenimiento_id}/fotos/", file_name)
    db.delete(foto)
    db.commit()
    update_preventivo(db_mantenimiento)
    return True
