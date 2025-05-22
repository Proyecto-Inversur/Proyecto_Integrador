import pytest
from src.services import auth as auth_service
from src.api.models import Usuario, Cuadrilla
from src.api.schemas import UserCreate, UserUpdate, CuadrillaCreate, CuadrillaUpdate, Role
from fastapi import HTTPException

def test_verify_user_token_user_success(db_session, mocker):
    """Test successful verification of a user token"""
    # Mock Firebase verify_id_token
    mocker.patch(
        "firebase_admin.auth.verify_id_token",
        return_value={"email": "user@test.com", "uid": "test-uid"}
    )

    # Create a user in the database
    db_user = Usuario(
        nombre="Test User",
        email="user@test.com",
        rol=Role.ADMIN,
        firebase_uid=None  # Simulate user without firebase_uid
    )
    db_session.add(db_user)
    db_session.commit()

    # Call verify_user_token
    result = auth_service.verify_user_token("valid_token", db_session)

    # Assertions
    assert result["type"] == "usuario"
    assert result["data"]["id"] == db_user.id
    assert result["data"]["nombre"] == "Test User"
    assert result["data"]["email"] == "user@test.com"
    assert result["data"]["rol"] == Role.ADMIN
    # Verify firebase_uid was updated
    db_session.refresh(db_user)
    assert db_user.firebase_uid == "test-uid"

def test_verify_user_token_cuadrilla_success(db_session, mocker):
    """Test successful verification of a cuadrilla token"""
    # Mock Firebase verify_id_token
    mocker.patch(
        "firebase_admin.auth.verify_id_token",
        return_value={"email": "cuadrilla@test.com", "uid": "cuadrilla-uid"}
    )

    # Create a cuadrilla in the database
    db_cuadrilla = Cuadrilla(
        nombre="Test Cuadrilla",
        email="cuadrilla@test.com",
        zona="Zona Test",
        firebase_uid=None  # Simulate cuadrilla without firebase_uid
    )
    db_session.add(db_cuadrilla)
    db_session.commit()

    # Call verify_user_token
    result = auth_service.verify_user_token("valid_token", db_session)

    # Assertions
    assert result["type"] == "cuadrilla"
    assert result["data"]["id"] == db_cuadrilla.id
    assert result["data"]["nombre"] == "Test Cuadrilla"
    assert result["data"]["email"] == "cuadrilla@test.com"
    assert result["data"]["zona"] == "Zona Test"
    # Verify firebase_uid was updated
    db_session.refresh(db_cuadrilla)
    assert db_cuadrilla.firebase_uid == "cuadrilla-uid"

def test_verify_user_token_invalid_token(db_session, mocker):
    """Test token verification with invalid token"""
    # Mock Firebase verify_id_token to raise an exception
    mocker.patch(
        "firebase_admin.auth.verify_id_token",
        side_effect=Exception("Invalid token")
    )

    with pytest.raises(HTTPException) as exc:
        auth_service.verify_user_token("invalid_token", db_session)
    assert exc.value.status_code == 401
    assert "Token inválido" in exc.value.detail

def test_create_firebase_user(db_session, mocker):
    """Test creating a user with admin permissions"""
    # Mock Firebase verify_id_token
    mocker.patch(
        "firebase_admin.auth.verify_id_token",
        return_value={"email": "user@test.com", "uid": "test-uid"}
    )
    # Mock Firebase get_user to simulate existing user
    mocker.patch(
        "firebase_admin.auth.get_user",
        return_value=type("obj", (), {"email": "user@test.com", "uid": "test-uid"})
    )

    user_data = UserCreate(
        nombre="Test User",
        email="user@test.com",
        rol=Role.ADMIN,
        id_token="mock-id-token"
    )
    current_entity = {
        "type": "usuario",
        "data": {"id": 1, "nombre": "Admin", "email": "admin@test.com", "rol": Role.ADMIN}
    }
    user = auth_service.create_firebase_user(user_data, db_session, current_entity, id_token="mock-id-token")
    assert user.nombre == "Test User"
    assert user.email == "user@test.com"
    assert user.rol == Role.ADMIN
    assert user.firebase_uid == "test-uid"

def test_create_firebase_user_unauthorized(db_session, mocker):
    """Test creating a user without admin permissions"""
    # Mock Firebase verify_id_token
    mocker.patch(
        "firebase_admin.auth.verify_id_token",
        return_value={"email": "user@test.com", "uid": "test-uid"}
    )

    user_data = UserCreate(
        nombre="Test User",
        email="user@test.com",
        rol=Role.ENCARGADO,
        id_token="mock-id-token"
    )
    current_entity = {
        "type": "usuario",
        "data": {"id": 2, "nombre": "Worker", "email": "worker@test.com", "rol": Role.ENCARGADO}
    }
    with pytest.raises(HTTPException) as exc:
        auth_service.create_firebase_user(user_data, db_session, current_entity, id_token="mock-id-token")
    assert exc.value.status_code == 403
    assert "No tienes permisos de administrador" in exc.value.detail

def test_update_firebase_user(db_session, mocker):
    """Test updating a user with admin permissions"""
    # Create a user
    db_user = Usuario(nombre="Old User", email="old@test.com", rol=Role.ADMIN, firebase_uid="test-uid")
    db_session.add(db_user)
    db_session.commit()
    user_id = db_user.id

    user_data = UserUpdate(
        nombre="Updated User",
        rol=Role.ADMIN
    )
    current_entity = {
        "type": "usuario",
        "data": {"id": 1, "nombre": "Admin", "email": "admin@test.com", "rol": Role.ADMIN}
    }
    user = auth_service.update_firebase_user(user_id, user_data, db_session, current_entity)
    assert user.nombre == "Updated User"
    assert user.email == "old@test.com"  # Email should not change
    assert user.rol == Role.ADMIN

def test_delete_firebase_user(db_session, mocker):
    """Test deleting a user with admin permissions"""
    # Create a user
    db_user = Usuario(nombre="Delete User", email="delete@test.com", rol=Role.ADMIN, firebase_uid="test-uid")
    db_session.add(db_user)
    db_session.commit()
    user_id = db_user.id

    # Mock Firebase delete_user
    mocker.patch("firebase_admin.auth.delete_user", return_value=None)

    current_entity = {
        "type": "usuario",
        "data": {"id": 1, "nombre": "Admin", "email": "admin@test.com", "rol": Role.ADMIN}
    }
    result = auth_service.delete_firebase_user(user_id, db_session, current_entity)
    assert "eliminado correctamente" in result["message"]

    # Verify user is deleted
    with pytest.raises(HTTPException) as exc:
        auth_service.update_firebase_user(user_id, UserUpdate(), db_session, current_entity)
    assert exc.value.status_code == 404

def test_create_firebase_cuadrilla(db_session, mocker):
    """Test creating a cuadrilla with usuario permissions"""
    # Mock Firebase verify_id_token
    mocker.patch(
        "firebase_admin.auth.verify_id_token",
        return_value={"email": "cuadrilla@test.com", "uid": "cuadrilla-uid"}
    )
    # Mock Firebase get_user
    mocker.patch(
        "firebase_admin.auth.get_user",
        return_value=type("obj", (), {"email": "cuadrilla@test.com", "uid": "cuadrilla-uid"})
    )

    cuadrilla_data = CuadrillaCreate(
        nombre="Test Cuadrilla",
        email="cuadrilla@test.com",
        zona="Zona Test",
        id_token="mock-id-token"
    )
    current_entity = {
        "type": "usuario",
        "data": {"id": 1, "nombre": "Admin", "email": "admin@test.com", "rol": Role.ADMIN}
    }
    cuadrilla = auth_service.create_firebase_cuadrilla(cuadrilla_data, db_session, current_entity, id_token="mock-id-token")
    assert cuadrilla.nombre == "Test Cuadrilla"
    assert cuadrilla.email == "cuadrilla@test.com"
    assert cuadrilla.zona == "Zona Test"
    assert cuadrilla.firebase_uid == "cuadrilla-uid"

def test_create_firebase_cuadrilla_unauthorized(db_session, mocker):
    """Test creating a cuadrilla with non-usuario entity"""
    # Mock Firebase verify_id_token
    mocker.patch(
        "firebase_admin.auth.verify_id_token",
        return_value={"email": "cuadrilla@test.com", "uid": "cuadrilla-uid"}
    )

    cuadrilla_data = CuadrillaCreate(
        nombre="Test Cuadrilla",
        email="cuadrilla@test.com",
        zona="Zona Test",
        id_token="mock-id-token"
    )
    current_entity = {
        "type": "cuadrilla",
        "data": {"id": 1, "nombre": "Cuadrilla", "email": "c@test.com", "zona": "Zona"}
    }
    with pytest.raises(HTTPException) as exc:
        auth_service.create_firebase_cuadrilla(cuadrilla_data, db_session, current_entity, id_token="mock-id-token")
    assert exc.value.status_code == 403
    assert "No tienes permisos" in exc.value.detail

def test_update_firebase_cuadrilla(db_session, mocker):
    """Test updating a cuadrilla with usuario permissions"""
    # Create a cuadrilla
    db_cuadrilla = Cuadrilla(nombre="Old Cuadrilla", email="oldc@test.com", zona="Old Zona", firebase_uid="cuadrilla-uid")
    db_session.add(db_cuadrilla)
    db_session.commit()
    cuadrilla_id = db_cuadrilla.id

    cuadrilla_data = CuadrillaUpdate(
        nombre="Updated Cuadrilla",
        zona="Updated Zona"
    )
    current_entity = {
        "type": "usuario",
        "data": {"id": 1, "nombre": "Admin", "email": "admin@test.com", "rol": Role.ADMIN}
    }
    cuadrilla = auth_service.update_firebase_cuadrilla(cuadrilla_id, cuadrilla_data, db_session, current_entity)
    assert cuadrilla.nombre == "Updated Cuadrilla"
    assert cuadrilla.email == "oldc@test.com"  # Email should not change
    assert cuadrilla.zona == "Updated Zona"

def test_delete_firebase_cuadrilla(db_session, mocker):
    """Test deleting a cuadrilla with usuario permissions"""
    # Create a cuadrilla
    db_cuadrilla = Cuadrilla(nombre="Delete Cuadrilla", email="deletec@test.com", zona="Zona", firebase_uid="cuadrilla-uid")
    db_session.add(db_cuadrilla)
    db_session.commit()
    cuadrilla_id = db_cuadrilla.id

    # Mock Firebase delete_user
    mocker.patch("firebase_admin.auth.delete_user", return_value=None)

    current_entity = {
        "type": "usuario",
        "data": {"id": 1, "nombre": "Admin", "email": "admin@test.com", "rol": Role.ADMIN}
    }
    result = auth_service.delete_firebase_cuadrilla(cuadrilla_id, db_session, current_entity)
    assert "eliminada correctamente" in result["message"]

    # Verify cuadrilla is deleted
    with pytest.raises(HTTPException) as exc:
        auth_service.update_firebase_cuadrilla(cuadrilla_id, CuadrillaUpdate(), db_session, current_entity)
    assert exc.value.status_code == 404