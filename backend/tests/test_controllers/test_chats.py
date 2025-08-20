from unittest.mock import patch, MagicMock, AsyncMock

def test_chat_correctivo_get(client):
    msg = MagicMock(id=1, firebase_uid="u", nombre_usuario="N", id_mantenimiento=1, texto="t", archivo=None, created_at="now")
    with patch("controllers.chats.get_chat_correctivo", return_value=[msg]):
        resp = client.get("/chat/correctivo/1")
    assert resp.status_code == 200
    assert resp.json()[0] == {"id": 1, "firebase_uid": "u", "nombre_usuario": "N", "id_mantenimiento": 1, "texto": "t", "archivo": None, "fecha": "now"}

def test_chat_preventivo_get(client):
    msg = MagicMock(id=1, firebase_uid="u", nombre_usuario="N", id_mantenimiento=1, texto="t", archivo=None, created_at="now")
    with patch("controllers.chats.get_chat_preventivo", return_value=[msg]):
        resp = client.get("/chat/preventivo/1")
    assert resp.status_code == 200
    assert resp.json()[0] == {"id": 1, "firebase_uid": "u", "nombre_usuario": "N", "id_mantenimiento": 1, "texto": "t", "archivo": None, "fecha": "now"}

def test_correctivo_message_send(client):
    msg = MagicMock(id=1, firebase_uid="u", nombre_usuario="N", id_mantenimiento=1, texto="t", archivo=None, created_at="now")
    with patch("controllers.chats.send_message_correctivo", AsyncMock(return_value=msg)):
        resp = client.post(
            "/chat/message-correctivo/1",
            data={"firebase_uid": "u", "nombre_usuario": "N", "texto": "t"},
        )
    assert resp.status_code == 200
    assert resp.json() == {"id": 1, "firebase_uid": "u", "nombre_usuario": "N", "id_mantenimiento": 1, "texto": "t", "archivo": None, "fecha": "now"}

def test_preventivo_message_send(client):
    msg = MagicMock(id=1, firebase_uid="u", nombre_usuario="N", id_mantenimiento=1, texto="t", archivo=None, created_at="now")
    with patch("controllers.chats.send_message_preventivo", AsyncMock(return_value=msg)):
        resp = client.post(
            "/chat/message-preventivo/1",
            data={"firebase_uid": "u", "nombre_usuario": "N", "texto": "t"},
        )
    assert resp.status_code == 200
    assert resp.json() == {"id": 1, "firebase_uid": "u", "nombre_usuario": "N", "id_mantenimiento": 1, "texto": "t", "archivo": None, "fecha": "now"}
