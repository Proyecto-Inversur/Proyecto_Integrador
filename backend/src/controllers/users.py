from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from config.database import get_db
from services.users import get_users, get_user, create_user, update_user, delete_user
from api.schemas import UserCreate, UserUpdate
from typing import List

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/", response_model=List[dict])
async def users_get(request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    users = get_users(db, current_entity)
    return [{"id": user.id, "nombre": user.nombre, "email": user.email, "rol": user.rol} for user in users]

@router.get("/{user_id}", response_model=dict)
async def user_get(user_id: int, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    user = get_user(db, user_id, current_entity)
    return {"id": user.id, "nombre": user.nombre, "email": user.email, "rol": user.rol}

@router.post("/", response_model=dict)
async def user_create(user: UserCreate, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    new_user = create_user(db, user.nombre, user.email, user.rol, current_entity)
    return {"id": new_user.id, "nombre": new_user.nombre, "email": new_user.email, "rol": new_user.rol}

@router.put("/{user_id}", response_model=dict)
async def user_update(user_id: int, user: UserUpdate, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    updated_user = update_user(db, user_id, user.nombre, user.email, user.rol, current_entity)
    return {"id": updated_user.id, "nombre": updated_user.nombre, "email": updated_user.email, "rol": updated_user.rol}

@router.delete("/{user_id}", response_model=dict)
async def user_delete(user_id: int, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    return delete_user(db, user_id, current_entity)