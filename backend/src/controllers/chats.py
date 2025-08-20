from fastapi import APIRouter, Depends, Request, UploadFile, Form, File
from sqlalchemy.orm import Session
from config.database import get_db
from services.chats import get_chat_correctivo, get_chat_preventivo, send_message_correctivo, send_message_preventivo
from typing import List, Optional

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("/correctivo/{mantenimiento_id}", response_model=List[dict])
def chat_correctivo_get(mantenimiento_id: int, request: Request, db_session: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    chat = get_chat_correctivo(db_session, mantenimiento_id, current_entity)
    if isinstance(chat, dict):
        return []
    return [
        {
            "id": message.id,
            "firebase_uid": message.firebase_uid,
            "nombre_usuario": message.nombre_usuario,
            "id_mantenimiento": message.id_mantenimiento,
            "texto": message.texto,
            "archivo": message.archivo,
            "fecha": message.created_at,
        }
        for message in chat
    ]

@router.get("/preventivo/{mantenimiento_id}", response_model=List[dict])
def chat_preventivo_get(mantenimiento_id: int, request: Request, db_session: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    chat = get_chat_preventivo(db_session, mantenimiento_id, current_entity)
    if isinstance(chat, dict):
        return []
    return [
        {
            "id": message.id,
            "firebase_uid": message.firebase_uid,
            "nombre_usuario": message.nombre_usuario,
            "id_mantenimiento": message.id_mantenimiento,
            "texto": message.texto,
            "archivo": message.archivo,
            "fecha": message.created_at,
        }
        for message in chat
    ]

@router.post("/message-correctivo/{mantenimiento_id}", response_model=dict)
async def correctivo_message_send(
    mantenimiento_id: int,
    request: Request,
    firebase_uid: str = Form(...),
    nombre_usuario: str = Form(...),
    texto: Optional[str] = Form(None),
    archivo: Optional[UploadFile] = File(None),
    db_session: Session = Depends(get_db)
):
    current_entity = request.state.current_entity
    new_message = await send_message_correctivo(
        db_session,
        mantenimiento_id,
        firebase_uid,
        nombre_usuario,
        current_entity,
        texto,
        archivo
    )
    return {
        "id": new_message.id,
        "firebase_uid": new_message.firebase_uid,
        "nombre_usuario": new_message.nombre_usuario,
        "id_mantenimiento": new_message.id_mantenimiento,
        "texto": new_message.texto,
        "archivo": new_message.archivo,
        "fecha": new_message.created_at
    }

@router.post("/message-preventivo/{mantenimiento_id}", response_model=dict)
async def preventivo_message_send(
    mantenimiento_id: int,  
    request: Request,
    firebase_uid: str = Form(...),
    nombre_usuario: str = Form(...),
    texto: Optional[str] = Form(None),
    archivo: Optional[UploadFile] = File(None),
    db_session: Session = Depends(get_db)
):
    current_entity = request.state.current_entity
    new_message = await send_message_preventivo(
        db_session,
        mantenimiento_id,
        firebase_uid,
        nombre_usuario,
        current_entity,
        texto,
        archivo
    )
    return {
        "id": new_message.id,
        "firebase_uid": new_message.firebase_uid,
        "nombre_usuario": new_message.nombre_usuario,
        "id_mantenimiento": new_message.id_mantenimiento,
        "texto": new_message.texto,
        "archivo": new_message.archivo,
        "fecha": new_message.created_at
    }