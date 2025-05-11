from fastapi import APIRouter, Depends, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from config.database import get_db
from services.auth import verify_user_token, create_firebase_user, create_firebase_cuadrilla
from api.schemas import UserCreate, CuadrillaCreate

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
    new_user = create_firebase_user(user_data, db, current_entity)
    return {"id": new_user.id, "nombre": new_user.nombre, "email": new_user.email, "rol": new_user.rol}

@router.post("/create-cuadrilla", response_model=dict)
async def create_cuadrilla(cuadrilla_data: CuadrillaCreate, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    new_cuadrilla = create_firebase_cuadrilla(cuadrilla_data, db, current_entity)
    return {"id": new_cuadrilla.id, "nombre": new_cuadrilla.nombre, "email": new_cuadrilla.email, "zona": new_cuadrilla.zona}