from unittest.mock import patch, MagicMock, AsyncMock

def test_notificaciones_correctivos_get(client):
    n = MagicMock(id=1, firebase_uid="uid", id_mantenimiento=1, mensaje="m", leida=False, created_at="now")
    with patch("controllers.notificaciones.get_notification_correctivo", return_value=[n]):
        resp = client.get("/notificaciones/correctivos/uid")
    assert resp.status_code == 200
    assert resp.json()[0]["id"] == 1

def test_notificaciones_preventivos_get(client):
    n = MagicMock(id=1, firebase_uid="uid", id_mantenimiento=1, mensaje="m", leida=False, created_at="now")
    with patch("controllers.notificaciones.get_notification_preventivo", return_value=[n]):
        resp = client.get("/notificaciones/preventivos/uid")
    assert resp.status_code == 200
    assert resp.json()[0]["id"] == 1

def test_leer_notificacion_correctivo(client):
    n = MagicMock(id=1, firebase_uid="uid", id_mantenimiento=1, mensaje="m", leida=True, created_at="now")
    with patch("controllers.notificaciones.notificacion_correctivo_leida", return_value=n):
        resp = client.put("/notificaciones/correctivos/1")
    assert resp.status_code == 200
    assert resp.json() == {"id": 1, "firebase_uid": "uid", "id_mantenimiento": 1, "mensaje": "m", "leida": True, "created_at": "now"}

def test_leer_notificacion_preventivo(client):
    n = MagicMock(id=1, firebase_uid="uid", id_mantenimiento=1, mensaje="m", leida=True, created_at="now")
    with patch("controllers.notificaciones.notificacion_preventivo_leida", return_value=n):
        resp = client.put("/notificaciones/preventivos/1")
    assert resp.status_code == 200
    assert resp.json() == {"id": 1, "firebase_uid": "uid", "id_mantenimiento": 1, "mensaje": "m", "leida": True, "created_at": "now"}

def test_notificaciones_delete(client):
    mock_result = {"message": "Notificaciones eliminadas"}
    with patch(
        "controllers.notificaciones.delete_notificaciones",
        return_value=mock_result
    ):
        resp = client.delete("/notificaciones/uid")
    assert resp.status_code == 200
    assert resp.json() == mock_result

def test_notificaciones_nearby(client):
    mock_result = {"message": "Notificaciones enviadas"}
    with patch("controllers.notificaciones.notify_nearby_maintenances", AsyncMock(return_value=mock_result)):
        payload = {"mantenimientos": [{"id": 1, "tipo": "correctivo", "mensaje": "hola"}]}
        resp = client.post("/notificaciones/nearby", json=payload)
    assert resp.status_code == 200
    assert resp.json() == mock_result

def test_notificaciones_delete(client):
    mock_result = {"message": "Notificaciones eliminadas"}
    with patch(
        "controllers.notificaciones.delete_notificaciones",
        return_value=mock_result
    ):
        resp = client.delete("/notificaciones/uid")
    assert resp.status_code == 200
    assert resp.json() == mock_result
