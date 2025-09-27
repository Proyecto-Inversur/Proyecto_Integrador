import os
from firebase_admin import auth
from sqlalchemy.orm import Session
from api.models import Usuario, Cuadrilla
from fastapi import HTTPException
from api.schemas import UserCreate, UserUpdate, CuadrillaCreate, CuadrillaUpdate, Role
import requests
import time

def verify_user_token(token: str, db: Session, retries: int = 3):
    # In E2E mode, short-circuit and return a static admin entity
    if os.environ.get("E2E_TESTING") == "true":
        return {
            "type": "usuario",
            "data": {
                "id": 1,
                "uid": "test-uid",
                "nombre": "Test User",
                "email": "test@example.com",
                "rol": Role.ADMIN,
            },
        }
    for attempt in range(retries):
        try:
            decoded_token = auth.verify_id_token(token)
            email = decoded_token.get("email")
            firebase_uid = decoded_token.get("uid")

            if not email:
                raise HTTPException(status_code=400, detail="No se proporcionó un email en el token")

            user = db.query(Usuario).filter(Usuario.email == email).first()
            if user:
                if user.firebase_uid and user.firebase_uid != firebase_uid:
                    raise HTTPException(status_code=403, detail="El UID de Firebase no coincide con el registrado para este usuario")
                if not user.firebase_uid:
                    user.firebase_uid = firebase_uid
                    db.commit()
                    db.refresh(user)
                return {
                    "type": "usuario",
                    "data": {
                        "id": user.id,
                        "uid": user.firebase_uid,
                        "nombre": user.nombre,
                        "email": user.email,
                        "rol": user.rol
                    }
                }

            cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.email == email).first()
            if cuadrilla:
                if cuadrilla.firebase_uid and cuadrilla.firebase_uid != firebase_uid:
                    raise HTTPException(status_code=403, detail="El UID de Firebase no coincide con el registrado para esta cuadrilla")
                if not cuadrilla.firebase_uid:
                    cuadrilla.firebase_uid = firebase_uid
                    db.commit()
                    db.refresh(cuadrilla)
                return {
                    "type": "cuadrilla",
                    "data": {
                        "id": cuadrilla.id,
                        "uid": cuadrilla.firebase_uid,
                        "nombre": cuadrilla.nombre,
                        "email": cuadrilla.email,
                        "zona": cuadrilla.zona
                    }
                }

            raise HTTPException(status_code=403, detail="Entidad no registrada en el sistema")
        except Exception as e:
            if "Token used too early" in str(e) and attempt < retries - 1:
                time.sleep(1)  # Wait before retry
                continue
            raise HTTPException(status_code=401, detail=f"Token inválido: {str(e)}")

def create_firebase_user(user_data: UserCreate, db: Session, current_entity: dict, id_token: str):
    if current_entity is not None:
        if not current_entity:
            raise HTTPException(status_code=401, detail="Autenticación requerida")
        if current_entity["type"] != "usuario" or current_entity["data"]["rol"] != Role.ADMIN:
            raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    
    try:
        if os.environ.get("E2E_TESTING") != "true":
            if not id_token:
                raise HTTPException(status_code=400, detail="Se requiere un ID token de Google")

            # Verify the Google ID token
            response = requests.get(f"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={id_token}")
            decoded_token = response.json()
            
            if "error" in decoded_token:
                raise HTTPException(status_code=401, detail=f"Token inválido: {decoded_token['error_description']}")

            email = decoded_token.get("email")
            if email != user_data.email:
                raise HTTPException(status_code=400, detail="El email del token no coincide con el proporcionado")
            
            # Create or fetch Firebase user
            try:
                firebase_user = auth.create_user(email=user_data.email)
                firebase_uid = firebase_user.uid
            except auth.EmailAlreadyExistsError:
                firebase_user = auth.get_user_by_email(user_data.email)
                firebase_uid = firebase_user.uid
        else:
            firebase_uid = "test-uid"

        db_user = Usuario(
            nombre=user_data.nombre,
            email=user_data.email,
            rol=user_data.rol,
            firebase_uid=firebase_uid
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al crear usuario: {str(e)}")

def update_firebase_user(user_id: int, user_data: UserUpdate, db: Session, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario" or current_entity["data"]["rol"] != Role.ADMIN:
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")

    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    try:
        if user_data.nombre is not None:
            db_user.nombre = user_data.nombre
        if user_data.rol is not None:
            db_user.rol = user_data.rol

        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al actualizar usuario: {str(e)}")

def delete_firebase_user(user_id: int, db: Session, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario" or current_entity["data"]["rol"] != Role.ADMIN:
        raise HTTPException(status_code=403, detail="No tienes permisos de administrador")

    db_user = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    try:
        if os.environ.get("E2E_TESTING") != "true" and db_user.firebase_uid:
            auth.delete_user(db_user.firebase_uid)
        db.delete(db_user)
        db.commit()
        return {"message": f"Usuario {db_user.email} eliminado correctamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al eliminar usuario: {str(e)}")

def create_firebase_cuadrilla(cuadrilla_data: CuadrillaCreate, db: Session, current_entity: dict, id_token: str):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    try:
        if os.environ.get("E2E_TESTING") != "true":
            if not id_token:
                raise HTTPException(status_code=400, detail="Se requiere un ID token de Google")

            # Verify the Google ID token
            response = requests.get(f"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={id_token}")
            decoded_token = response.json()

            if "error" in decoded_token:
                raise HTTPException(status_code=401, detail=f"Token inválido: {decoded_token['error_description']}")

            email = decoded_token.get("email")

            if email != cuadrilla_data.email:
                raise HTTPException(status_code=400, detail="El email del token no coincide con el proporcionado")

            # Create or fetch Firebase user
            try:
                firebase_user = auth.create_user(email=cuadrilla_data.email)
                firebase_uid = firebase_user.uid
            except auth.EmailAlreadyExistsError:
                firebase_user = auth.get_user_by_email(cuadrilla_data.email)
                firebase_uid = firebase_user.uid
        else:
            firebase_uid = "test-uid"

        db_cuadrilla = Cuadrilla(
            nombre=cuadrilla_data.nombre,
            zona=cuadrilla_data.zona,
            email=cuadrilla_data.email,
            firebase_uid=firebase_uid
        )
        db.add(db_cuadrilla)
        db.commit()
        db.refresh(db_cuadrilla)
        return db_cuadrilla
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al crear cuadrilla: {str(e)}")

def update_firebase_cuadrilla(cuadrilla_id: int, cuadrilla_data: CuadrillaUpdate, db: Session, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")

    db_cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == cuadrilla_id).first()
    if not db_cuadrilla:
        raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")

    try:
        if cuadrilla_data.nombre is not None:
            db_cuadrilla.nombre = cuadrilla_data.nombre
        if cuadrilla_data.zona is not None:
            db_cuadrilla.zona = cuadrilla_data.zona

        db.commit()
        db.refresh(db_cuadrilla)
        return db_cuadrilla
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al actualizar cuadrilla: {str(e)}")

def delete_firebase_cuadrilla(cuadrilla_id: int, db: Session, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")

    db_cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.id == cuadrilla_id).first()
    if not db_cuadrilla:
        raise HTTPException(status_code=404, detail="Cuadrilla no encontrada")

    try:
        if os.environ.get("E2E_TESTING") != "true" and db_cuadrilla.firebase_uid:
            auth.delete_user(db_cuadrilla.firebase_uid)
        db.delete(db_cuadrilla)
        db.commit()
        return {"message": f"Cuadrilla {db_cuadrilla.email} eliminada correctamente"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al eliminar cuadrilla: {str(e)}")
