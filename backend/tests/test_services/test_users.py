import pytest
from fastapi import HTTPException
from src.services import users as users_service
from src.api.models import Usuario
from src.api.schemas import Role

def test_get_users_requires_auth(db_session):
    with pytest.raises(HTTPException) as exc:
        users_service.get_users(db_session, None)
    assert exc.value.status_code == 401

def test_get_users_requires_admin(db_session):
    with pytest.raises(HTTPException) as exc:
        users_service.get_users(db_session, {"type": "usuario", "data": {"rol": Role.ENCARGADO}})
    assert exc.value.status_code == 403

def test_get_users_success(db_session):
    db_session.add(Usuario(nombre="User1", email="u1@example.com", rol=Role.ENCARGADO))
    db_session.commit()
    users = users_service.get_users(db_session, {"type": "usuario", "data": {"rol": Role.ADMIN}})
    assert len(users) == 1

def test_get_users_wrong_entity_type(db_session):
    with pytest.raises(HTTPException) as exc:
        users_service.get_users(db_session, {"type": "cuadrilla", "data": {}})
    assert exc.value.status_code == 403

def test_get_user_requires_auth(db_session):
    with pytest.raises(HTTPException) as exc:
        users_service.get_user(db_session, 1, None)
    assert exc.value.status_code == 401

def test_get_user_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        users_service.get_user(db_session, 999, {"type": "usuario", "data": {"rol": Role.ADMIN}})
    assert exc.value.status_code == 404

def test_get_user_no_permission(db_session):
    user = Usuario(nombre="User2", email="u2@example.com", rol=Role.ENCARGADO)
    db_session.add(user)
    db_session.commit()
    with pytest.raises(HTTPException) as exc:
        users_service.get_user(
            db_session,
            user.id,
            {"type": "usuario", "data": {"id": 999, "rol": Role.ENCARGADO}},
        )
    assert exc.value.status_code == 403

def test_get_user_wrong_entity_type(db_session):
    user = Usuario(nombre="User4", email="u4@example.com", rol=Role.ENCARGADO)
    db_session.add(user)
    db_session.commit()

    with pytest.raises(HTTPException) as exc:
        users_service.get_user(
            db_session,
            user.id,
            {"type": "cuadrilla", "data": {}},
        )
    assert exc.value.status_code == 403

def test_get_user_admin_success(db_session):
    user = Usuario(nombre="User3", email="u3@example.com", rol=Role.ENCARGADO)
    db_session.add(user)
    db_session.commit()
    result = users_service.get_user(
        db_session,
        user.id,
        {"type": "usuario", "data": {"rol": Role.ADMIN}},
    )
    assert result.email == "u3@example.com"
