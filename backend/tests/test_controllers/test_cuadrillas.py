import pytest
from fastapi.testclient import TestClient
from src.api.routes import app
from src.services.auth import verify_user_token
from firebase_admin import auth

client = TestClient(app)

app.dependency_overrides = {}

# Mock verify_user_token to simulate admin authentication
def mock_verify_user_token(token, db):
    return {
        "type": "usuario",
        "data": {
            "id": 1,
            "nombre": "Admin",
            "email": "admin@test.com",
            "rol": "Administrador"
        }
    }

@pytest.fixture(autouse=True)
def setup_auth_override(mocker):
    """Override authentication for all tests"""
    mocker.patch("src.services.auth.verify_user_token", side_effect=mock_verify_user_token)

def test_listar_cuadrillas(mocker):
    """Test listing all cuadrillas"""
    # Mock Firebase auth functions
    mocker.patch(
        "firebase_admin.auth.verify_id_token",
        return_value={"email": "cuadrilla@testget.com", "uid": "cuadrillaget-uid"}
    )
    mocker.patch(
        "firebase_admin.auth.get_user",
        side_effect=auth.UserNotFoundError("User not found")
    )
    mocker.patch(
        "firebase_admin.auth.update_user",
        return_value=type("obj", (), {"uid": "cuadrillaget-uid"})
    )

    cuadrilla_data = {
        "nombre": "Test Get Cuadrilla",
        "email": "cuadrilla@testget.com",
        "zona": "Zona Test",
        "id_token": "mock-id-token"
    }
    response = client.post("/auth/create-cuadrilla", json=cuadrilla_data, headers={"Authorization": "Bearer mock-token"})
    assert response.status_code == 200

    # List cuadrillas
    response = client.get("/cuadrillas/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_get_cuadrilla(mocker):
    """Test retrieving a single cuadrilla by ID"""
    # Mock Firebase auth functions
    mocker.patch(
        "firebase_admin.auth.verify_id_token",
        return_value={"email": "cuadrilla@testgetbyid.com", "uid": "cuadrillagetbyid-uid"}
    )
    mocker.patch(
        "firebase_admin.auth.get_user",
        side_effect=auth.UserNotFoundError("User not found")
    )
    mocker.patch(
        "firebase_admin.auth.update_user",
        return_value=type("obj", (), {"uid": "cuadrillagetbyid-uid"})
    )

    cuadrilla_data = {
        "nombre": "Test GetById Cuadrilla",
        "email": "cuadrilla@testgetbyid.com",
        "zona": "Zona Test",
        "id_token": "mock-id-token"
    }
    response = client.post("/auth/create-cuadrilla", json=cuadrilla_data, headers={"Authorization": "Bearer mock-token"})
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