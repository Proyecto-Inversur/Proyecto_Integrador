import pytest
from fastapi.testclient import TestClient
from src.api.routes import app

client = TestClient(app)

app.dependency_overrides = {}

def test_listar_cuadrillas(mocker):
    """Test listing all cuadrillas"""
    # Mock Firebase create_user to avoid actual Firebase calls
    mocker.patch("firebase_admin.auth.create_user", return_value=type("obj", (), {"uid": "cuadrilla-uid"}))

    # Create a cuadrilla using the API
    cuadrilla_data = {
        "nombre": "Get Cuadrilla",
        "email": "get@test.com",
        "zona": "Get Zona",
        "contrasena": "password123"
    }
    response = client.post("/auth/create-cuadrilla", json=cuadrilla_data)
    assert response.status_code == 200

    # List cuadrillas
    response = client.get("/cuadrillas/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_get_cuadrilla(mocker):
    """Test retrieving a single cuadrilla by ID"""
    # Mock Firebase create_user
    mocker.patch("firebase_admin.auth.create_user", return_value=type("obj", (), {"uid": "cuadrillabyid-uid"}))

    # Create a cuadrilla using the API
    cuadrilla_data = {
        "nombre": "GetById Cuadrilla",
        "email": "getcuadrillabyid@test.com",
        "zona": "GetById Zona",
        "contrasena": "password123"
    }
    response = client.post("/auth/create-cuadrilla", json=cuadrilla_data)
    assert response.status_code == 200
    cuadrilla_id = response.json()["id"]

    # Get the cuadrilla
    response = client.get(f"/cuadrillas/{cuadrilla_id}")
    assert response.status_code == 200
    assert response.json()["id"] == cuadrilla_id

def test_get_cuadrilla_not_found():
    """Test retrieving a non-existent cuadrilla"""
    response = client.get("/cuadrillas/9999")
    assert response.status_code == 404
    assert "no encontrada" in response.json()["detail"]