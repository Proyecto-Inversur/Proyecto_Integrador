from fastapi import APIRouter, Depends, Request, UploadFile, Form
from sqlalchemy.orm import Session
from config.database import get_db
from services.chats import get_chat_correctivo, get_chat_preventivo, send_message_correctivo, send_message_preventivo
from api.schemas import Message
from typing import List

router = APIRouter(prefix="/chat", tags=["chat"])

@router.get("/correctivo/{mantenimiento_id}", response_model=List[dict])
def chat_correctivo_get(mantenimiento_id: int, request: Request, db_session: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    chat = get_chat_correctivo(db_session, mantenimiento_id, current_entity)
    return [
        {
            "id": message.id,
            "firebase_uid": message.firebase_uid,
            "nombre_usuario": message.nombre_usuario,
            "id_mantenimiento": message.id_mantenimiento,
            "texto": message.texto,
            "archivo": message.archivo,
            "fecha": message.fecha,
        }
        for message in chat
    ]

@router.get("/preventivo/{mantenimiento_id}", response_model=List[dict])
def chat_preventivo_get(mantenimiento_id: int, request: Request, db_session: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    chat = get_chat_preventivo(db_session, mantenimiento_id, current_entity)
    return [
        {
            "id": message.id,
            "firebase_uid": message.firebase_uid,
            "nombre_usuario": message.nombre_usuario,
            "id_mantenimiento": message.id_mantenimiento,
            "texto": message.texto,
            "archivo": message.archivo,
            "fecha": message.fecha,
        }
        for message in chat
    ]

@router.post("/correctivo/{mantenimiento_id}", response_model=dict)
def correctivo_message_send(mantenimiento_id: int, message: Message, request: Request, db_session: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    new_message = send_message_correctivo(
        db_session,
        mantenimiento_id,
        message.firebase_uid,
        message.nombre_usuario,
        message.fecha,
        current_entity,
        message.texto,
        message.archivo
    )
    return {
        "id": new_message.id,
        "firebase_uid": new_message.firebase_uid,
        "nombre_usuario": new_message.nombre_usuario,
        "id_mantenimiento": new_message.id_mantenimiento,
        "texto": new_message.texto,
        "archivo": new_message.archivo,
        "fecha": new_message.fecha
    }

@router.post("/preventivo/{mantenimiento_id}", response_model=dict)
def preventivo_message_send(mantenimiento_id: int, message: Message, request: Request, db_session: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    new_message = send_message_preventivo(
        db_session,
        mantenimiento_id,
        message.firebase_uid,
        message.nombre_usuario,
        message.fecha,
        current_entity,
        message.texto,
        message.archivo
    )
    return {
        "id": new_message.id,
        "firebase_uid": new_message.firebase_uid,
        "nombre_usuario": new_message.nombre_usuario,
        "id_mantenimiento": new_message.id_mantenimiento,
        "texto": new_message.texto,
        "archivo": new_message.archivo,
        "fecha": new_message.fecha
    }