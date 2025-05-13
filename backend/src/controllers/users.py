from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from config.database import get_db
from services.users import get_users, get_user
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