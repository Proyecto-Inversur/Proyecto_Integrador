from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from config.database import get_db
from services.auth import verify_user_token, create_firebase_user, update_firebase_user, delete_firebase_user, create_firebase_cuadrilla, update_firebase_cuadrilla, delete_firebase_cuadrilla
from api.schemas import UserCreate, UserUpdate, CuadrillaCreate, CuadrillaUpdate

router = APIRouter(prefix="/auth", tags=["auth"])
security = HTTPBearer()

@router.post("/verify")
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(get_db)):
    token = credentials.credentials
    entity = verify_user_token(token, db)
    return entity

@router.post("/create-user", response_model=dict)
async def create_user(user_data: UserCreate, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    new_user = create_firebase_user(user_data, db, current_entity, user_data.id_token)
    return {"id": new_user.id, "nombre": new_user.nombre, "email": new_user.email, "rol": new_user.rol}

@router.put("/update-user/{user_id}", response_model=dict)
async def update_user(user_id: int, user_data: UserUpdate, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    updated_user = update_firebase_user(user_id, user_data, db, current_entity)
    return {"id": updated_user.id, "nombre": updated_user.nombre, "email": updated_user.email, "rol": updated_user.rol}

@router.delete("/delete-user/{user_id}", response_model=dict)
async def delete_user(user_id: int, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    result = delete_firebase_user(user_id, db, current_entity)
    return result

@router.post("/create-cuadrilla", response_model=dict)
async def create_cuadrilla(cuadrilla_data: CuadrillaCreate, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    new_cuadrilla = create_firebase_cuadrilla(cuadrilla_data, db, current_entity, cuadrilla_data.id_token)
    return {"id": new_cuadrilla.id, "nombre": new_cuadrilla.nombre, "email": new_cuadrilla.email, "zona": new_cuadrilla.zona}

@router.put("/update-cuadrilla/{cuadrilla_id}", response_model=dict)
async def update_cuadrilla(cuadrilla_id: int, cuadrilla_data: CuadrillaUpdate, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    updated_cuadrilla = update_firebase_cuadrilla(cuadrilla_id, cuadrilla_data, db, current_entity)
    return {"id": updated_cuadrilla.id, "nombre": updated_cuadrilla.nombre, "email": updated_cuadrilla.email, "zona": updated_cuadrilla.zona}

@router.delete("/delete-cuadrilla/{cuadrilla_id}", response_model=dict)
async def delete_cuadrilla(cuadrilla_id: int, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    result = delete_firebase_cuadrilla(cuadrilla_id, db, current_entity)
    return result