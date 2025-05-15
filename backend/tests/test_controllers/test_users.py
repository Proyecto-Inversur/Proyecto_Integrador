import pytest
from fastapi.testclient import TestClient
from src.api.routes import app

client = TestClient(app)

app.dependency_overrides = {}

def test_listar_users(mocker):
    """Test listing all users with admin permissions"""
    # Mock Firebase create_user to avoid actual Firebase calls
    mocker.patch("firebase_admin.auth.create_user", return_value=type("obj", (), {"uid": "test-uid"}))

    # Create a user using the API
    user_data = {
        "nombre": "Get User",
        "email": "get@test.com",
        "rol": "Administrador",
        "contrasena": "password123"
    }
    response = client.post("/auth/create-user", json=user_data)
    assert response.status_code == 200

    # List users
    response = client.get("/users/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_get_user(mocker):
    """Test retrieving a user as an admin"""
    # Mock Firebase create_user to avoid actual Firebase calls
    mocker.patch("firebase_admin.auth.create_user", return_value=type("obj", (), {"uid": "userbyid-uid"}))

    # Create a user using the API
    user_data = {
        "nombre": "GetById User",
        "email": "getuserbyid@test.com",
        "rol": "Administrador",
        "contrasena": "password123"
    }
    response = client.post("/auth/create-user", json=user_data)
    assert response.status_code == 200
    user_id = response.json()["id"]

    # Get the cuadrilla
    response = client.get(f"/users/{user_id}")
    assert response.status_code == 200
    assert response.json()["id"] == user_id

def test_get_user_not_found(db_session):
    """Test retrieving a non-existent user"""
    response = client.get("/users/9999")
    assert response.status_code == 404
    assert "Usuario no encontrado" in response.json()["detail"]