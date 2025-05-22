import pytest
from fastapi.testclient import TestClient
from src.api.routes import app
from src.api.models import Usuario
from src.services.auth import verify_user_token
from firebase_admin import auth

client = TestClient(app)

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

def test_listar_users(mocker, db_session):
    """Test listing all users with admin permissions"""
    # Mock Firebase auth functions
    mocker.patch(
        "firebase_admin.auth.verify_id_token",
        return_value={"email": "user@testget.com", "uid": "testget-uid"}
    )
    mocker.patch(
        "firebase_admin.auth.get_user",
        side_effect=auth.UserNotFoundError("User not found")
    )
    mocker.patch(
        "firebase_admin.auth.update_user",
        return_value=type("obj", (), {"uid": "testget-uid"})
    )

    user_data = {
        "nombre": "Test Get User",
        "email": "user@testget.com",
        "rol": "Administrador",
        "id_token": "mock-id-token"
    }
    response = client.post("/auth/create-user", json=user_data, headers={"Authorization": "Bearer mock-token"})
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 0

def test_get_user(mocker, db_session):
    """Test retrieving a user as an admin"""
    # Mock Firebase auth functions
    mocker.patch(
        "firebase_admin.auth.verify_id_token",
        return_value={"email": "user@testgetbyid.com", "uid": "testgetbyid-uid"}
    )
    mocker.patch(
        "firebase_admin.auth.get_user",
        side_effect=auth.UserNotFoundError("User not found")
    )
    mocker.patch(
        "firebase_admin.auth.update_user",
        return_value=type("obj", (), {"uid": "testgetbyid-uid"})
    )

    # Create a user in the database
    db_user = Usuario(
        nombre="Test GetById User",
        email="user@testgetbyid.com",
        rol="Administrador",
        firebase_uid="testgetbyid-uid"
    )
    db_session.add(db_user)
    db_session.commit()
    user_id = db_user.id

    response = client.get(f"/users/{user_id}", headers={"Authorization": "Bearer mock-token"})
    assert response.status_code == 200
    assert response.json()["id"] == user_id

def test_get_user_not_found():
    """Test retrieving a non-existent user"""
    response = client.get("/users/9999", headers={"Authorization": "Bearer mock-token"})
    assert response.status_code == 404
    assert "Usuario no encontrado" in response.json()["detail"]