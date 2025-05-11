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

def create_user(db: Session, nombre: str, email: str, rol: str, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario" or current_entity["data"]["rol"] != Role.ADMIN:
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    existing_user = db.query(Usuario).filter(Usuario.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="El email ya está registrado")
    
    db_user = Usuario(nombre=nombre, email=email, rol=rol)
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

def update_user(db: Session, user_id: int, nombre: str = None, email: str = None, rol: str = None, current_entity: dict = None):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    if current_entity["type"] != "usuario" or (current_entity["data"]["rol"] != Role.ADMIN and current_entity["data"]["id"] != user_id):
        raise HTTPException(status_code=403, detail="No tienes permisos para actualizar este usuario")
    
    if nombre:
        db_user.nombre = nombre
    if email:
        existing_user = db.query(Usuario).filter(Usuario.email == email, Usuario.id != user_id).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="El email ya está registrado")
        db_user.email = email
    if rol and (current_entity["type"] != "usuario" or current_entity["data"]["rol"] != Role.ADMIN):
        raise HTTPException(status_code=403, detail="Solo los administradores pueden cambiar roles")
    if rol:
        db_user.rol = rol
    db.commit()
    db.refresh(db_user)
    return db_user

def delete_user(db: Session, user_id: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario" or current_entity["data"]["rol"] != Role.ADMIN:
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.delete(db_user)
    db.commit()
    return {"message": f"Usuario con id {user_id} eliminado"}