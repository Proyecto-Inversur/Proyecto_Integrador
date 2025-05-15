import pytest
from src.services import users as users_service
from src.api.models import Usuario
from src.api.schemas import Role
from fastapi import HTTPException

def test_get_users_as_admin(db_session):
    """Test retrieving all users with admin permissions"""
    # Create two users
    db_session.add(Usuario(nombre="User 1", email="user1@test.com", rol=Role.ADMIN))
    db_session.add(Usuario(nombre="User 2", email="user2@test.com", rol=Role.ADMIN))
    db_session.commit()

    current_entity = {
        "type": "usuario",
        "data": {"id": 1, "nombre": "Admin", "email": "admin@test.com", "rol": Role.ADMIN}
    }
    users = users_service.get_users(db_session, current_entity)
    assert len(users) >= 2
    assert any(u.nombre == "User 1" for u in users)
    assert any(u.nombre == "User 2" for u in users)

def test_get_users_unauthorized(db_session):
    """Test retrieving users without admin permissions"""
    current_entity = {
        "type": "usuario",
        "data": {"id": 2, "nombre": "Worker", "email": "worker@test.com", "rol": Role.ENCARGADO}
    }
    with pytest.raises(HTTPException) as exc:
        users_service.get_users(db_session, current_entity)
    assert exc.value.status_code == 403
    assert "No tienes permisos de administrador" in exc.value.detail

def test_get_user_as_admin(db_session):
    """Test retrieving a user as an admin"""
    db_user = Usuario(nombre="Test User", email="user@test.com", rol=Role.ADMIN)
    db_session.add(db_user)
    db_session.commit()
    user_id = db_user.id

    current_entity = {
        "type": "usuario",
        "data": {"id": 1, "nombre": "Admin", "email": "admin@test.com", "rol": Role.ADMIN}
    }
    user = users_service.get_user(db_session, user_id, current_entity)
    assert user.id == user_id
    assert user.nombre == "Test User"
    assert user.email == "user@test.com"
    assert user.rol == Role.ADMIN

def test_get_own_user_as_non_admin(db_session):
    """Test retrieving own user data as a non-admin"""
    db_user = Usuario(nombre="Test Worker", email="worker@test.com", rol=Role.ENCARGADO)
    db_session.add(db_user)
    db_session.commit()
    user_id = db_user.id

    current_entity = {
        "type": "usuario",
        "data": {"id": user_id, "nombre": "Test Worker", "email": "worker@test.com", "rol": Role.ENCARGADO}
    }
    user = users_service.get_user(db_session, user_id, current_entity)
    assert user.id == user_id
    assert user.nombre == "Test Worker"
    assert user.email == "worker@test.com"
    assert user.rol == Role.ENCARGADO

def test_get_other_user_as_non_admin(db_session):
    """Test retrieving another user's data as a non-admin"""
    db_user1 = Usuario(nombre="User 1", email="user1@test.com", rol=Role.ENCARGADO)
    db_user2 = Usuario(nombre="User 2", email="user2@test.com", rol=Role.ENCARGADO)
    db_session.add_all([db_user1, db_user2])
    db_session.commit()
    user1_id = db_user1.id
    user2_id = db_user2.id

    current_entity = {
        "type": "usuario",
        "data": {"id": user1_id, "nombre": "User 1", "email": "user1@test.com", "rol": Role.ENCARGADO}
    }
    with pytest.raises(HTTPException) as exc:
        users_service.get_user(db_session, user2_id, current_entity)
    assert exc.value.status_code == 403
    assert "No tienes permisos para ver este usuario" in exc.value.detail

def test_get_user_not_found(db_session):
    """Test retrieving a non-existent user"""
    current_entity = {
        "type": "usuario",
        "data": {"id": 1, "nombre": "Admin", "email": "admin@test.com", "rol": Role.ADMIN}
    }
    with pytest.raises(HTTPException) as exc:
        users_service.get_user(db_session, 9999, current_entity)
    assert exc.value.status_code == 404
    assert "Usuario no encontrado" in exc.value.detail