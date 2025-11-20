from typing import Optional

from fastapi import HTTPException
from firebase_admin import db
from sqlalchemy.orm import Session

from api.models import Cliente, Sucursal
from auth.firebase import initialize_firebase

ALLOWED_FRECUENCIAS = {"Mensual", "Trimestral", "Cuatrimestral", "Semestral"}


def _ensure_usuario(current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity.get("type") != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")


def _validate_direccion(direccion: Optional[dict]):
    if not isinstance(direccion, dict):
        raise HTTPException(status_code=400, detail="El campo direccion debe ser un objeto con address, lat y lng")
    if "address" not in direccion:
        raise HTTPException(status_code=400, detail="El campo direccion debe incluir address")


def _validate_frecuencia(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None
    if value not in ALLOWED_FRECUENCIAS:
        raise HTTPException(status_code=400, detail="Frecuencia de preventivo inválida")
    return value


def _sync_firebase_sucursal(sucursal_id: int, nombre: str, direccion: Optional[dict]):
    if direccion is None:
        return
    try:
        initialize_firebase()
        ref = db.reference(f"/sucursales/{sucursal_id}")
        ref.set(
            {
                "name": nombre,
                "lat": direccion.get("lat", 0.0),
                "lng": direccion.get("lng", 0.0),
                "cliente_id": direccion.get("cliente_id"),
            }
        )
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error guardando en Firebase: {str(exc)}")


def _update_firebase_sucursal(
    sucursal_id: int,
    nombre: Optional[str] = None,
    direccion: Optional[dict] = None,
    cliente_id: Optional[int] = None,
):
    updates = {}
    if nombre is not None:
        updates["name"] = nombre
    if direccion:
        if "lat" in direccion:
            updates["lat"] = direccion["lat"]
        if "lng" in direccion:
            updates["lng"] = direccion["lng"]
    if cliente_id is not None:
        updates["cliente_id"] = cliente_id
    if not updates:
        return
    try:
        initialize_firebase()
        ref = db.reference(f"/sucursales/{sucursal_id}")
        ref.update(updates)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error actualizando en Firebase: {str(exc)}")


def _delete_firebase_sucursal(sucursal_id: int):
    try:
        initialize_firebase()
        ref = db.reference(f"/sucursales/{sucursal_id}")
        ref.delete()
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Error eliminando de Firebase: {str(exc)}")


def _get_cliente(db_session: Session, cliente_id: int) -> Cliente:
    cliente = db_session.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


def get_sucursales_by_cliente(db_session: Session, cliente_id: int):
    _get_cliente(db_session, cliente_id)
    return db_session.query(Sucursal).filter(Sucursal.cliente_id == cliente_id).all()


def get_sucursal(db_session: Session, sucursal_id: int):
    sucursal = db_session.query(Sucursal).filter(Sucursal.id == sucursal_id).first()
    if not sucursal:
        raise HTTPException(status_code=404, detail="Sucursal no encontrada")
    return sucursal


def create_sucursal(
    db_session: Session,
    cliente_id: int,
    nombre: str,
    zona: str,
    direccion: dict,
    superficie: str,
    frecuencia_preventivo: Optional[str],
    current_entity: dict,
):
    _ensure_usuario(current_entity)
    _get_cliente(db_session, cliente_id)
    _validate_direccion(direccion)

    frecuencia = _validate_frecuencia(frecuencia_preventivo)
    sucursal = Sucursal(
        nombre=nombre,
        zona=zona,
        direccion=direccion.get("address", ""),
        superficie=superficie,
        cliente_id=cliente_id,
        frecuencia_preventivo=frecuencia,
    )
    try:
        db_session.add(sucursal)
        db_session.commit()
        db_session.refresh(sucursal)
    except Exception as exc:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=f"Error guardando sucursal: {str(exc)}")

    _sync_firebase_sucursal(sucursal.id, nombre, {**direccion, "cliente_id": cliente_id})
    return sucursal


def update_sucursal(
    db_session: Session,
    sucursal_id: int,
    current_entity: dict,
    nombre: Optional[str] = None,
    zona: Optional[str] = None,
    direccion: Optional[dict] = None,
    superficie: Optional[str] = None,
    frecuencia_preventivo: Optional[str] = None,
    frecuencia_preventivo_provided: bool = False,
    cliente_id: Optional[int] = None,
):
    _ensure_usuario(current_entity)
    sucursal = get_sucursal(db_session, sucursal_id)

    if cliente_id is not None and cliente_id != sucursal.cliente_id:
        _get_cliente(db_session, cliente_id)
        sucursal.cliente_id = cliente_id
        cliente_changed = True
    else:
        cliente_changed = False

    if nombre is not None:
        sucursal.nombre = nombre
    if zona is not None:
        sucursal.zona = zona
    if direccion is not None:
        _validate_direccion(direccion)
        sucursal.direccion = direccion.get("address", "")
    if superficie is not None:
        sucursal.superficie = superficie
    if frecuencia_preventivo_provided:
        sucursal.frecuencia_preventivo = _validate_frecuencia(frecuencia_preventivo)

    try:
        db_session.commit()
        db_session.refresh(sucursal)
    except Exception as exc:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=f"Error actualizando sucursal: {str(exc)}")

    cliente_value = sucursal.cliente_id if cliente_changed else None
    _update_firebase_sucursal(sucursal.id, nombre, direccion, cliente_value)
    return sucursal


def delete_sucursal(db_session: Session, sucursal_id: int, current_entity: dict):
    _ensure_usuario(current_entity)
    sucursal = get_sucursal(db_session, sucursal_id)

    try:
        db_session.delete(sucursal)
        db_session.commit()
    except Exception as exc:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=f"Error eliminando sucursal: {str(exc)}")

    _delete_firebase_sucursal(sucursal_id)
    return {"message": f"Sucursal con id {sucursal_id} eliminada"}
