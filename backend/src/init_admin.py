from sqlalchemy.orm import Session
from config.database import SessionLocal
from api.models import Usuario
from api.schemas import Role
from fastapi import HTTPException
from firebase_admin import auth

def init_admin(email: str, nombre: str, password: str, rol: Role = Role.ADMIN):
    db: Session = SessionLocal()
    try:
        # Verificar si ya existe un administrador
        existing_admin = db.query(Usuario).filter(Usuario.rol == Role.ADMIN).first()
        if existing_admin:
            print(f"Ya existe un administrador: {existing_admin.email}")
            return
        
        existing_user = auth.get_user_by_email(email)
        
        if existing_user:
            print(f"El usuario ya existe en Firebase: {email}")
            firebase_uid = existing_user.uid
        else:
            firebase_user = auth.create_user(email=email)
            firebase_uid = firebase_user.uid
        
        db_user = Usuario(
            nombre=nombre,
            email=email,
            rol=rol,
            firebase_uid=firebase_uid
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        print(f"Administrador creado: {email}")
    except HTTPException as e:
        print(f"Error al crear administrador: {e.detail}")
    except Exception as e:
        print(f"Error inesperado: {str(e)}")
    finally:
        db.close()