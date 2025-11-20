from datetime import date, datetime
from typing import List, Optional
import os

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from api.models import Cliente, Cuadrilla, MantenimientoCorrectivo, MantenimientoCorrectivoFoto, Sucursal
from services.gcloud_storage import delete_file_in_folder, upload_file_to_gcloud
from services.google_sheets import append_correctivo, delete_correctivo, update_correctivo
from services.notificaciones import notify_user, notify_users_correctivo

GOOGLE_CLOUD_BUCKET_NAME = os.getenv("GOOGLE_CLOUD_BUCKET_NAME")


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


def _ensure_cliente_sucursal(cliente_id: int, sucursal: Sucursal):
    if sucursal.cliente_id != cliente_id:
        raise HTTPException(status_code=400, detail="La sucursal no pertenece al cliente seleccionado")


def _get_cuadrilla(db: Session, cuadrilla_id: int) -> Cuadrilla:
    cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == cuadrilla_id).first()
    if not cuadrilla:
        raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")
    return cuadrilla


def get_mantenimientos_correctivos(db: Session):
    return db.query(MantenimientoCorrectivo).all()


def get_mantenimiento_correctivo(db: Session, mantenimiento_id: int):
    mantenimiento = db.query(MantenimientoCorrectivo).filter(MantenimientoCorrectivo.id == mantenimiento_id).first()
    if not mantenimiento:
        raise HTTPException(status_code=404, detail="Mantenimiento correctivo no encontrado")
    return mantenimiento


async def create_mantenimiento_correctivo(
    db: Session,
    cliente_id: int,
    sucursal_id: int,
    id_cuadrilla: Optional[int],
    fecha_apertura: date,
    numero_caso: str,
    incidente: str,
    rubro: str,
    estado: str,
    prioridad: str,
    current_entity: dict,
):
    _ensure_usuario(current_entity)

    cliente = _get_cliente(db, cliente_id)
    sucursal = _get_sucursal(db, sucursal_id)
    _ensure_cliente_sucursal(cliente.id, sucursal)

    cuadrilla = _get_cuadrilla(db, id_cuadrilla) if id_cuadrilla else None

    db_mantenimiento = MantenimientoCorrectivo(
        cliente_id=cliente_id,
        sucursal_id=sucursal_id,
        id_cuadrilla=id_cuadrilla,
        fecha_apertura=fecha_apertura,
        numero_caso=numero_caso,
        incidente=incidente,
        rubro=rubro,
        estado=estado,
        prioridad=prioridad,
    )
    db.add(db_mantenimiento)
    db.commit()
    db.refresh(db_mantenimiento)
    append_correctivo(db_mantenimiento)
    if cuadrilla is not None:
        if prioridad == "Alta":
            notify_user(
                db_session=db,
                firebase_uid=cuadrilla.firebase_uid,
                id_mantenimiento=db_mantenimiento.id,
                mensaje=f"Nuevo correctivo asignado - Sucursal: {sucursal.nombre} | Incidente: {db_mantenimiento.incidente} | Prioridad: {db_mantenimiento.prioridad}",
                title="Nuevo correctivo urgente asignado",
                body=f"Sucursal: {sucursal.nombre} | Incidente: {db_mantenimiento.incidente}",
            )
        await notify_users_correctivo(
            db_session=db,
            id_mantenimiento=db_mantenimiento.id,
            mensaje=f"Nuevo correctivo asignado - Sucursal: {sucursal.nombre} | Incidente: {db_mantenimiento.incidente} | Prioridad: {db_mantenimiento.prioridad}",
            firebase_uid=cuadrilla.firebase_uid,
        )
    return db_mantenimiento


async def update_mantenimiento_correctivo(
    db: Session,
    mantenimiento_id: int,
    current_entity: dict,
    cliente_id: Optional[int] = None,
    sucursal_id: Optional[int] = None,
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
    extendido: Optional[datetime] = None,
):
    _ensure_usuario(current_entity)

    db_mantenimiento = get_mantenimiento_correctivo(db, mantenimiento_id)

    bucket_name = GOOGLE_CLOUD_BUCKET_NAME
    if not bucket_name:
        raise HTTPException(status_code=500, detail="Google Cloud Bucket name not configured")
    base_folder = f"mantenimientos_correctivos/{mantenimiento_id}"

    final_cliente_id = cliente_id if cliente_id is not None else db_mantenimiento.cliente_id
    final_sucursal_id = sucursal_id if sucursal_id is not None else db_mantenimiento.sucursal_id
    cliente = _get_cliente(db, final_cliente_id)
    sucursal = _get_sucursal(db, final_sucursal_id)
    _ensure_cliente_sucursal(cliente.id, sucursal)

    db_mantenimiento.cliente_id = cliente.id
    db_mantenimiento.sucursal_id = sucursal.id

    if fecha_apertura is not None:
        db_mantenimiento.fecha_apertura = fecha_apertura
    if numero_caso is not None:
        db_mantenimiento.numero_caso = numero_caso
    if incidente is not None:
        db_mantenimiento.incidente = incidente
    if rubro is not None:
        db_mantenimiento.rubro = rubro

    if id_cuadrilla:
        cuadrilla = _get_cuadrilla(db, id_cuadrilla)
        db_mantenimiento.id_cuadrilla = id_cuadrilla
    else:
        cuadrilla = _get_cuadrilla(db, db_mantenimiento.id_cuadrilla) if db_mantenimiento.id_cuadrilla else None

    if planilla is not None:
        planilla_url = await upload_file_to_gcloud(planilla, bucket_name, f"{base_folder}/planilla")
        db_mantenimiento.planilla = planilla_url

    if fotos is not None:
        for foto in fotos:
            url = await upload_file_to_gcloud(foto, bucket_name, f"{base_folder}/fotos")
            new_foto = MantenimientoCorrectivoFoto(mantenimiento_id=mantenimiento_id, url=url)
            db.add(new_foto)

    if fecha_cierre is not None:
        if fecha_cierre == date(1, 1, 1):
            db_mantenimiento.fecha_cierre = None
        else:
            db_mantenimiento.fecha_cierre = fecha_cierre

    if estado is not None:
        db_mantenimiento.estado = estado
        if estado not in ("Solucionado", "Finalizado"):
            db_mantenimiento.fecha_cierre = None
        if estado == "Solucionado":
            await notify_users_correctivo(
                db_session=db,
                id_mantenimiento=mantenimiento_id,
                mensaje=f"Correctivo Solucionado - Sucursal: {sucursal.nombre} | Incidente: {db_mantenimiento.incidente}",
                firebase_uid=None,
            )

    if prioridad is not None:
        db_mantenimiento.prioridad = prioridad

    prioridad_actual = prioridad if prioridad is not None else db_mantenimiento.prioridad

    if extendido is not None:
        db_mantenimiento.extendido = extendido
        if cuadrilla:
            await notify_users_correctivo(
                db_session=db,
                id_mantenimiento=mantenimiento_id,
                mensaje=f"Extendido solicitado - Sucursal: {sucursal.nombre} | Cuadrilla: {cuadrilla.nombre}",
                firebase_uid=None,
            )

    db.commit()
    db.refresh(db_mantenimiento)
    update_correctivo(db_mantenimiento)

    if cuadrilla is not None and prioridad_actual == "Alta":
        notify_user(
            db_session=db,
            firebase_uid=cuadrilla.firebase_uid,
            id_mantenimiento=db_mantenimiento.id,
            mensaje=f"Correctivo urgente asignado - Sucursal: {sucursal.nombre} | Incidente: {db_mantenimiento.incidente} | Prioridad: {db_mantenimiento.prioridad}",
            title="Correctivo urgente asignado",
            body=f"Sucursal: {sucursal.nombre} | Incidente: {db_mantenimiento.incidente}",
        )
        await notify_users_correctivo(
            db_session=db,
            id_mantenimiento=db_mantenimiento.id,
            mensaje=f"Correctivo urgente asignado - Sucursal: {sucursal.nombre} | Incidente: {db_mantenimiento.incidente} | Prioridad: {db_mantenimiento.prioridad}",
            firebase_uid=cuadrilla.firebase_uid,
        )

    return db_mantenimiento


def delete_mantenimiento_correctivo(db: Session, mantenimiento_id: int, current_entity: dict):
    _ensure_usuario(current_entity)
    db_mantenimiento = get_mantenimiento_correctivo(db, mantenimiento_id)
    db.delete(db_mantenimiento)
    db.commit()
    delete_correctivo(mantenimiento_id)
    return {"message": f"Mantenimiento correctivo con id {mantenimiento_id} eliminado"}


def delete_mantenimiento_planilla(db: Session, mantenimiento_id: int, file_name: str, current_entity: dict) -> bool:
    _ensure_usuario(current_entity)

    db_mantenimiento = get_mantenimiento_correctivo(db, mantenimiento_id)
    delete_file_in_folder(GOOGLE_CLOUD_BUCKET_NAME, f"mantenimientos_correctivos/{mantenimiento_id}/planilla/", file_name)

    db_mantenimiento.planilla = None

    db.commit()
    db.refresh(db_mantenimiento)
    update_correctivo(db_mantenimiento)
    return True


def delete_mantenimiento_photo(db: Session, mantenimiento_id: int, file_name: str, current_entity: dict) -> bool:
    _ensure_usuario(current_entity)

    db_mantenimiento = get_mantenimiento_correctivo(db, mantenimiento_id)

    foto = (
        db.query(MantenimientoCorrectivoFoto)
        .filter(
            MantenimientoCorrectivoFoto.mantenimiento_id == mantenimiento_id,
            MantenimientoCorrectivoFoto.url.endswith(file_name),
        )
        .first()
    )
    if not foto:
        raise HTTPException(status_code=404, detail="Foto no encontrada")

    delete_file_in_folder(GOOGLE_CLOUD_BUCKET_NAME, f"mantenimientos_correctivos/{mantenimiento_id}/fotos/", file_name)
    db.delete(foto)
    db.commit()
    update_correctivo(db_mantenimiento)
    return True
