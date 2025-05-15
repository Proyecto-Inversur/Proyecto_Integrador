import pytest
from fastapi.testclient import TestClient
from src.api.routes import app
from src.api.models import Usuario, Cuadrilla

client = TestClient(app)

app.dependency_overrides = {}

def test_create_user(mocker):
    """Test creating a user with admin permissions"""
    # Mock Firebase create_user to avoid actual Firebase calls
    mocker.patch("firebase_admin.auth.create_user", return_value=type("obj", (), {"uid": "test-uid"}))

    user_data = {
        "nombre": "Test User",
        "email": "user@test.com",
        "rol": "Administrador",
        "contrasena": "password123"
    }
    response = client.post("/auth/create-user", json=user_data)
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "Test User"
    assert data["email"] == "user@test.com"
    assert data["rol"] == "Administrador"
    assert "id" in data

def test_update_user(db_session, mocker):
    """Test updating a user with admin permissions"""
    # Create a user in the database
    db_user = Usuario(nombre="Old User", email="old@test.com", rol="Encargado de Mantenimiento", firebase_uid="test-uid")
    db_session.add(db_user)
    db_session.commit()
    user_id = db_user.id

    # Mock Firebase update_user
    mocker.patch("firebase_admin.auth.update_user", return_value=None)

    update_data = {
        "nombre": "Updated User",
        "email": "updated@test.com",
        "rol": "Administrador"
    }
    response = client.put(f"/auth/update-user/{user_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "Updated User"
    assert data["email"] == "updated@test.com"
    assert data["rol"] == "Administrador"

def test_delete_user(db_session, mocker):
    """Test deleting a user with admin permissions"""
    # Create a user in the database
    db_user = Usuario(nombre="Delete User", email="delete@test.com", rol="Encargado de Mantenimiento", firebase_uid="test-uid")
    db_session.add(db_user)
    db_session.commit()
    user_id = db_user.id

    # Mock Firebase delete_user
    mocker.patch("firebase_admin.auth.delete_user", return_value=None)

    response = client.delete(f"/auth/delete-user/{user_id}")
    assert response.status_code == 200
    assert "eliminado correctamente" in response.json()["message"]

def test_create_cuadrilla(mocker):
    """Test creating a cuadrilla with usuario permissions"""
    # Mock Firebase create_user to avoid actual Firebase calls
    mocker.patch("firebase_admin.auth.create_user", return_value=type("obj", (), {"uid": "test-uid"}))

    cuadrilla_data = {
        "nombre": "Test Cuadrilla",
        "email": "cuadrilla@test.com",
        "zona": "Zona Test",
        "contrasena": "password123"
    }
    response = client.post("/auth/create-cuadrilla", json=cuadrilla_data)
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "Test Cuadrilla"
    assert data["email"] == "cuadrilla@test.com"
    assert data["zona"] == "Zona Test"
    assert "id" in data

def test_update_cuadrilla(db_session, mocker):
    """Test updating a cuadrilla with usuario permissions"""
    # Create a cuadrilla in the database
    db_cuadrilla = Cuadrilla(nombre="Old Cuadrilla", email="oldc@test.com", zona="Old Zona", firebase_uid="cuadrilla-uid")
    db_session.add(db_cuadrilla)
    db_session.commit()
    cuadrilla_id = db_cuadrilla.id

    # Mock Firebase update_user
    mocker.patch("firebase_admin.auth.update_user", return_value=None)

    update_data = {
        "nombre": "Updated Cuadrilla",
        "email": "updatedc@test.com",
        "zona": "Updated Zona"
    }
    response = client.put(f"/auth/update-cuadrilla/{cuadrilla_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "Updated Cuadrilla"
    assert data["email"] == "updatedc@test.com"
    assert data["zona"] == "Updated Zona"

def test_delete_cuadrilla(db_session, mocker):
    """Test deleting a cuadrilla with usuario permissions"""
    # Create a cuadrilla in the database
    db_cuadrilla = Cuadrilla(nombre="Delete Cuadrilla", email="deletec@test.com", zona="Zona", firebase_uid="cuadrilla-uid")
    db_session.add(db_cuadrilla)
    db_session.commit()
    cuadrilla_id = db_cuadrilla.id

    # Mock Firebase delete_user
    mocker.patch("firebase_admin.auth.delete_user", return_value=None)

    response = client.delete(f"/auth/delete-cuadrilla/{cuadrilla_id}")
    assert response.status_code == 200
    assert "eliminada correctamente" in response.json()["message"]