from unittest.mock import AsyncMock, patch
import asyncio
from io import BytesIO
import pytest
from fastapi import UploadFile, HTTPException
from src.services import chats as chat_service
from src.api.models import MensajeCorrectivo, MensajePreventivo

def test_get_chat_correctivo(db_session):
    msg = MensajeCorrectivo(firebase_uid="uid", nombre_usuario="N", id_mantenimiento=1, texto="hola")
    db_session.add(msg)
    db_session.commit()

    result = chat_service.get_chat_correctivo(db_session, 1, {"type": "usuario"})

    assert len(result) == 1
    assert result[0].texto == "hola"

def test_get_chat_preventivo(db_session):
    msg = MensajePreventivo(firebase_uid="uid", nombre_usuario="N", id_mantenimiento=1, texto="hola")
    db_session.add(msg)
    db_session.commit()

    result = chat_service.get_chat_preventivo(db_session, 1, {"type": "usuario"})

    assert len(result) == 1
    assert result[0].texto == "hola"

def test_send_message_correctivo(db_session):
    with patch(
        "src.services.chats.upload_chat_file_to_gcloud", AsyncMock(return_value="http://file")
    ) as mock_upload, patch(
        "src.services.chats.chat_manager.send_message", AsyncMock()
    ) as mock_send:
        result = asyncio.run(
            chat_service.send_message_correctivo(
                db_session,
                1,
                "uid",
                "N",
                {"type": "usuario"},
                texto="hola",
            )
        )

    assert result.texto == "hola"
    mock_upload.assert_not_awaited()
    mock_send.assert_awaited_once()
    stored = db_session.query(MensajeCorrectivo).all()
    assert len(stored) == 1
    assert stored[0].texto == "hola"

def test_send_message_preventivo(db_session):
    upload = UploadFile(filename="t.txt", file=BytesIO(b"data"))
    with patch(
        "src.services.chats.upload_chat_file_to_gcloud",
        AsyncMock(return_value="http://uploaded"),
    ) as mock_upload, patch(
        "src.services.chats.chat_manager.send_message", AsyncMock()
    ) as mock_send:
        result = asyncio.run(
            chat_service.send_message_preventivo(
                db_session,
                1,
                "uid",
                "N",
                {"type": "usuario"},
                archivo=upload,
            )
        )

    assert result.archivo == "http://uploaded"
    mock_upload.assert_awaited_once()
    mock_send.assert_awaited_once()
    stored = db_session.query(MensajePreventivo).all()
    assert len(stored) == 1
    assert stored[0].archivo == "http://uploaded"

def test_get_chat_correctivo_no_auth(db_session):
    with pytest.raises(HTTPException):
        chat_service.get_chat_correctivo(db_session, 1, None)

def test_get_chat_correctivo_no_messages(db_session):
    result = chat_service.get_chat_correctivo(db_session, 1, {"type": "usuario"})
    assert result == {"message": "No hay mensajes"}

def test_get_chat_preventivo_no_auth(db_session):
    with pytest.raises(HTTPException):
        chat_service.get_chat_preventivo(db_session, 1, None)

def test_get_chat_preventivo_no_messages(db_session):
    result = chat_service.get_chat_preventivo(db_session, 1, {"type": "usuario"})
    assert result == {"message": "No hay mensajes"}

def test_send_message_correctivo_no_auth(db_session):
    with pytest.raises(HTTPException):
        asyncio.run(
            chat_service.send_message_correctivo(
                db_session, 1, "uid", "N", None, texto="hola"
            )
        )

def test_send_message_correctivo_no_bucket(db_session, monkeypatch):
    monkeypatch.setattr(chat_service, "GOOGLE_CLOUD_BUCKET_NAME", None)
    with pytest.raises(HTTPException):
        asyncio.run(
            chat_service.send_message_correctivo(
                db_session, 1, "uid", "N", {"type": "usuario"}, texto="hola"
            )
        )

def test_send_message_preventivo_no_auth(db_session):
    with pytest.raises(HTTPException):
        asyncio.run(
            chat_service.send_message_preventivo(
                db_session, 1, "uid", "N", None, texto="hola"
            )
        )

def test_send_message_preventivo_no_bucket(db_session, monkeypatch):
    monkeypatch.setattr(chat_service, "GOOGLE_CLOUD_BUCKET_NAME", None)
    with pytest.raises(HTTPException):
        asyncio.run(
            chat_service.send_message_preventivo(
                db_session, 1, "uid", "N", {"type": "usuario"}, texto="hola"
            )
        )
