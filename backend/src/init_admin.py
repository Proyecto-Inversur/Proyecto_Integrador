from sqlalchemy.orm import Session
from config.database import SessionLocal
from api.models import Usuario
from api.schemas import UserCreate, Role
from services.auth import create_firebase_user
from fastapi import HTTPException

def init_admin(email: str, nombre: str, password: str, rol: Role = Role.ADMIN):
    db: Session = SessionLocal()
    try:
        # Verificar si ya existe un administrador
        existing_admin = db.query(Usuario).filter(Usuario.rol == Role.ADMIN).first()
        if existing_admin:
            print(f"Ya existe un administrador: {existing_admin.email}")
            return

        # Crear el usuario administrador
        user_data = UserCreate(
            nombre=nombre,
            email=email,
            rol=rol,
            contrasena=password
        )
        # No necesitamos current_entity para la inicialización
        new_admin = create_firebase_user(user_data, db, current_entity=None)
        print(f"Administrador creado: {new_admin.email}")
    except HTTPException as e:
        print(f"Error al crear administrador: {e.detail}")
    except Exception as e:
        print(f"Error inesperado: {str(e)}")
    finally:
        db.close()