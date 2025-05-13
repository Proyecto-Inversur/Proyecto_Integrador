from sqlalchemy.orm import Session
from api.models import Usuario
from fastapi import HTTPException
from api.schemas import Role

def get_users(db: Session, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario" or current_entity["data"]["rol"] != Role.ADMIN:
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    return db.query(Usuario).all()

def get_user(db: Session, user_id: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    if current_entity["type"] != "usuario" or (current_entity["data"]["rol"] != Role.ADMIN and current_entity["data"]["id"] != user_id):
        raise HTTPException(status_code=403, detail="No tienes permisos para ver este usuario")
    return user