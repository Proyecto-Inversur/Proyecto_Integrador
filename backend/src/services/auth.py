from firebase_admin import auth
from sqlalchemy.orm import Session
from api.models import Usuario, Cuadrilla
from fastapi import HTTPException
from api.schemas import UserCreate, CuadrillaCreate, Role

def verify_user_token(token: str, db: Session):
    try:
        decoded_token = auth.verify_id_token(token)
        email = decoded_token.get("email")
        firebase_uid = decoded_token.get("uid")

        if not email:
            raise HTTPException(status_code=400, detail="No se proporcionó un email en el token")

        user = db.query(Usuario).filter(Usuario.email == email).first()
        if user:
            if not user.firebase_uid:
                user.firebase_uid = firebase_uid
                db.commit()
                db.refresh(user)
            return {
                "type": "usuario",
                "data": {
                    "id": user.id,
                    "nombre": user.nombre,
                    "email": user.email,
                    "rol": user.rol
                }
            }

        cuadrilla = db.query(Cuadrilla).filter(Cuadrilla.email == email).first()
        if cuadrilla:
            if not cuadrilla.firebase_uid:
                cuadrilla.firebase_uid = firebase_uid
                db.commit()
                db.refresh(cuadrilla)
            return {
                "type": "cuadrilla",
                "data": {
                    "id": cuadrilla.id,
                    "nombre": cuadrilla.nombre,
                    "email": cuadrilla.email,
                    "zona": cuadrilla.zona
                }
            }

        raise HTTPException(status_code=403, detail="Entidad no registrada en el sistema")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Token inválido: {str(e)}")

def create_firebase_user(user_data: UserCreate, db: Session, current_entity: dict = None):
    # Solo verificar permisos si current_entity no es None (es decir, no es inicialización)
    if current_entity is not None:
        if not current_entity:
            raise HTTPException(status_code=401, detail="Autenticación requerida")
        if current_entity["type"] != "usuario" or current_entity["data"]["rol"] != Role.ADMIN:
            raise HTTPException(status_code=403, detail="No tienes permisos de administrador")
    
    try:
        if user_data.contrasena:
            firebase_user = auth.create_user(
                email=user_data.email,
                password=user_data.contrasena
            )
        else:
            firebase_user = auth.create_user(email=user_data.email)

        db_user = Usuario(
            nombre=user_data.nombre,
            email=user_data.email,
            rol=user_data.rol,
            firebase_uid=firebase_user.uid
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al crear usuario: {str(e)}")

def create_firebase_cuadrilla(cuadrilla_data: CuadrillaCreate, db: Session, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    if current_entity["type"] != "usuario":
        raise HTTPException(status_code=403, detail="No tienes permisos")
    
    try:
        if cuadrilla_data.contrasena:
            firebase_user = auth.create_user(
                email=cuadrilla_data.email,
                password=cuadrilla_data.contrasena
            )
        else:
            firebase_user = auth.create_user(email=cuadrilla_data.email)

        db_cuadrilla = Cuadrilla(
            nombre=cuadrilla_data.nombre,
            zona=cuadrilla_data.zona,
            email=cuadrilla_data.email,
            firebase_uid=firebase_user.uid
        )
        db.add(db_cuadrilla)
        db.commit()
        db.refresh(db_cuadrilla)
        return db_cuadrilla
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al crear cuadrilla: {str(e)}")