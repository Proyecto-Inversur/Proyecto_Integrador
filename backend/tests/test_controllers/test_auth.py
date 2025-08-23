from unittest.mock import patch, MagicMock

def test_verify_token_endpoint(client):
    with patch("controllers.auth.verify_user_token", return_value={"ok": True}):
        response = client.post("/auth/verify", headers={"Authorization": "Bearer token"})
    assert response.status_code == 200
    assert response.json() == {"ok": True}

def test_user_create(client):
    u = MagicMock(id=1, nombre="N", email="u@x.com", rol="Administrador")
    with patch("controllers.auth.create_firebase_user", return_value=u):
        payload = {"nombre": "N", "email": "u@x.com", "rol": "Administrador", "id_token": "token123"}
        resp = client.post("/auth/create-user", json=payload)
    assert resp.status_code == 200
    assert resp.json() == {"id": 1, "nombre": "N", "email": "u@x.com", "rol": "Administrador"}

def test_user_update(client):
    u = MagicMock(id=1, nombre="N", email="u@x.com", rol="Administrador")
    with patch("controllers.auth.update_firebase_user", return_value=u):
        payload = {"nombre": "N", "email": "u@x.com", "rol": "Administrador"}
        resp = client.put("/auth/update-user/1", json=payload)
    assert resp.status_code == 200
    assert resp.json() == {"id": 1, "nombre": "N", "email": "u@x.com", "rol": "Administrador"}

def test_user_delete(client):
    mock_result = {"message": "Usuario u@x.com eliminado correctamente"}
    with patch("controllers.auth.delete_firebase_user", return_value=mock_result):
        resp = client.delete("/auth/delete-user/1")
    assert resp.status_code == 200
    assert resp.json() == mock_result

def test_cuadrilla_create(client):
    c = MagicMock(id=1, nombre="N", email="c@x.com", zona="Z")
    with patch("controllers.auth.create_firebase_cuadrilla", return_value=c):
        payload = {"nombre": "N", "email": "c@x.com", "zona": "Z", "id_token": "token123"}
        resp = client.post("/auth/create-cuadrilla", json=payload)
    assert resp.status_code == 200
    assert resp.json() == {"id": 1, "nombre": "N", "email": "c@x.com", "zona": "Z"}

def test_cuadrilla_update(client):
    c = MagicMock(id=1, nombre="N", email="c@x.com", zona="Z")
    with patch("controllers.auth.update_firebase_cuadrilla", return_value=c):
        payload = {"nombre": "N", "email": "c@x.com", "zona": "Z"}
        resp = client.put("/auth/update-cuadrilla/1", json=payload)
    assert resp.status_code == 200
    assert resp.json() == {"id": 1, "nombre": "N", "email": "c@x.com", "zona": "Z"}

def test_cuadrilla_delete(client):
    mock_result = {"message": "Cuadrilla c@x.com eliminada correctamente"}
    with patch("controllers.auth.delete_firebase_cuadrilla", return_value=mock_result):
        resp = client.delete("/auth/delete-cuadrilla/1")
    assert resp.status_code == 200
    assert resp.json() == mock_result
