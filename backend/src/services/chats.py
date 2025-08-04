from sqlalchemy.orm import Session
from api.models import MensajeCorrectivo, MensajePreventivo
from fastapi import HTTPException, UploadFile
from typing import Optional
from services.gcloud_storage import upload_chat_file_to_gcloud
import os

GOOGLE_CLOUD_BUCKET_NAME = os.getenv("GOOGLE_CLOUD_BUCKET_NAME")

def get_chat_correctivo(db_session: Session, mantenimiento_id: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    chat = db_session.query(MensajeCorrectivo).filter(MensajeCorrectivo.id_mantenimiento == mantenimiento_id).all()
    if not chat:
        return {"message": "No hay mensajes"}
    return chat

def get_chat_preventivo(db_session: Session, mantenimiento_id: int, current_entity: dict):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    chat = db_session.query(MensajePreventivo).filter(MensajePreventivo.id_mantenimiento == mantenimiento_id).all()
    if not chat:
        return {"message": "No hay mensajes"}
    return chat

async def send_message_correctivo(
    db_session: Session,
    id_mantenimiento: int,
    firebase_uid: str,
    nombre_usuario: str,
    current_entity: dict,
    texto: Optional[str] = None,
    archivo: Optional[UploadFile] = None,
    ):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    bucket_name = GOOGLE_CLOUD_BUCKET_NAME
    if not bucket_name:
        raise HTTPException(status_code=500, detail="Google Cloud Bucket name not configured")
    
    try:
        base_folder = f"mantenimientos_correctivos/{id_mantenimiento}"
        db_message = MensajeCorrectivo(
            firebase_uid=firebase_uid,
            nombre_usuario=nombre_usuario,
            id_mantenimiento=id_mantenimiento
        )
        if texto is not None:
            db_message.texto = texto
        if archivo is not None:
            archivo_url = await upload_chat_file_to_gcloud(archivo, bucket_name, f"{base_folder}/chat")
            db_message.archivo = archivo_url
        
        db_session.add(db_message)
        db_session.commit()
        db_session.refresh(db_message)
        return db_message
    except Exception as e:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")

async def send_message_preventivo(
    db_session: Session,
    id_mantenimiento: int,
    firebase_uid: str,
    nombre_usuario: str,
    current_entity: dict,
    texto: Optional[str] = None,
    archivo: Optional[UploadFile] = None,
    ):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")
    
    bucket_name = GOOGLE_CLOUD_BUCKET_NAME
    if not bucket_name:
        raise HTTPException(status_code=500, detail="Google Cloud Bucket name not configured")
    
    try:
        base_folder = f"mantenimientos_preventivos/{id_mantenimiento}"
        db_message = MensajePreventivo(
            firebase_uid=firebase_uid,
            nombre_usuario=nombre_usuario,
            id_mantenimiento=id_mantenimiento
        )
        if texto is not None:
            db_message.texto = texto
        if archivo is not None:
            archivo_url = await upload_chat_file_to_gcloud(archivo, bucket_name, f"{base_folder}/chat")
            db_message.archivo = archivo_url
        
        db_session.add(db_message)
        db_session.commit()
        db_session.refresh(db_message)
        return db_message
    except Exception as e:
        db_session.rollback()
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")