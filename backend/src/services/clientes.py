from typing import Optional

from sqlalchemy.orm import Session
from fastapi import HTTPException
from firebase_admin import db

from api.models import Cliente
from auth.firebase import initialize_firebase


def _ensure_usuario(current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity.get("type") != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")


def get_clientes(db_session: Session):
    return db_session.query(Cliente).all()


def get_cliente(db_session: Session, cliente_id: int):
    cliente = db_session.query(Cliente).filter(Cliente.id == cliente_id).first()
    if not cliente:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return cliente


def create_cliente(db_session: Session, nombre: str, contacto: str, email: str, current_entity: dict):
    _ensure_usuario(current_entity)

    cliente = Cliente(nombre=nombre, contacto=contacto, email=email)
    try:
        db_session.add(cliente)
        db_session.commit()
        db_session.refresh(cliente)
    except Exception as exc:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=f"Error guardando cliente: {str(exc)}")
    return cliente


def update_cliente(
    db_session: Session,
    cliente_id: int,
    current_entity: dict,
    nombre: Optional[str] = None,
    contacto: Optional[str] = None,
    email: Optional[str] = None,
):
    _ensure_usuario(current_entity)
    cliente = get_cliente(db_session, cliente_id)

    if nombre is not None:
        cliente.nombre = nombre
    if contacto is not None:
        cliente.contacto = contacto
    if email is not None:
        cliente.email = email

    try:
        db_session.commit()
        db_session.refresh(cliente)
    except Exception as exc:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=f"Error actualizando cliente: {str(exc)}")
    return cliente


def delete_cliente(db_session: Session, cliente_id: int, current_entity: dict):
    _ensure_usuario(current_entity)
    cliente = get_cliente(db_session, cliente_id)
    sucursales_ids = [s.id for s in cliente.sucursales]

    try:
        db_session.delete(cliente)
        db_session.commit()
    except Exception as exc:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=f"Error eliminando cliente: {str(exc)}")

    if sucursales_ids:
        try:
            initialize_firebase()
            for sucursal_id in sucursales_ids:
                ref = db.reference(f"/sucursales/{sucursal_id}")
                ref.delete()
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Error eliminando sucursales de Firebase: {str(exc)}")

    return {"message": f"Cliente con id {cliente_id} eliminado"}
