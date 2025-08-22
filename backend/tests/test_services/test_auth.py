import pytest
from fastapi import HTTPException
from src.services import auth as auth_service
from src.api.schemas import UserCreate, UserUpdate, CuadrillaCreate, CuadrillaUpdate, Role
from src.api.models import Usuario, Cuadrilla

def test_verify_user_token(db_session, monkeypatch):
    user = Usuario(nombre="Test", email="user@example.com", rol="Admin")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    def mock_verify_id_token(token):
        return {"email": "user@example.com", "uid": "uid123"}

    monkeypatch.setattr(auth_service.auth, "verify_id_token", mock_verify_id_token)

    result = auth_service.verify_user_token("token", db_session)

    assert result["type"] == "usuario"
    assert result["data"]["email"] == "user@example.com"
    assert result["data"]["uid"] == "uid123"
    assert db_session.query(Usuario).filter_by(email="user@example.com").first().firebase_uid == "uid123"

def test_create_firebase_user(db_session, monkeypatch):
    user_data = UserCreate(nombre="Nuevo", email="new@example.com", rol=Role.ENCARGADO, id_token="t")
    current = {"type": "usuario", "data": {"rol": Role.ADMIN}}

    class DummyResp:
        def json(self):
            return {"email": "new@example.com", "sub": "google"}

    class DummyFirebaseUser:
        uid = "fb123"

    monkeypatch.setattr(auth_service.requests, "get", lambda url: DummyResp())
    monkeypatch.setattr(auth_service.auth, "create_user", lambda email: DummyFirebaseUser())

    result = auth_service.create_firebase_user(user_data, db_session, current, "token")

    assert result.email == "new@example.com"
    assert result.firebase_uid == "fb123"

def test_update_firebase_user(db_session):
    user = Usuario(nombre="Old", email="old@example.com", rol=Role.ENCARGADO, firebase_uid="u1")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    update = UserUpdate(nombre="Nuevo")
    current = {"type": "usuario", "data": {"rol": Role.ADMIN}}

    result = auth_service.update_firebase_user(user.id, update, db_session, current)

    assert result.nombre == "Nuevo"

def test_delete_firebase_user(db_session, monkeypatch):
    user = Usuario(nombre="Del", email="del@example.com", rol=Role.ENCARGADO, firebase_uid="uid123")
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    monkeypatch.setattr(auth_service.auth, "delete_user", lambda uid: None)

    current = {"type": "usuario", "data": {"rol": Role.ADMIN}}
    result = auth_service.delete_firebase_user(user.id, db_session, current)

    assert "eliminado" in result["message"]

def test_create_firebase_cuadrilla(db_session, monkeypatch):
    data = CuadrillaCreate(nombre="C1", zona="Z", email="c@example.com", id_token="t")
    current = {"type": "usuario"}

    class DummyResp:
        def json(self):
            return {"email": "c@example.com", "sub": "google"}

    class DummyFirebaseUser:
        uid = "fb123"

    monkeypatch.setattr(auth_service.requests, "get", lambda url: DummyResp())
    monkeypatch.setattr(auth_service.auth, "create_user", lambda email: DummyFirebaseUser())

    result = auth_service.create_firebase_cuadrilla(data, db_session, current, "token")

    assert result.email == "c@example.com"
    assert result.firebase_uid == "fb123"

def test_update_firebase_cuadrilla(db_session):
    cuadrilla = Cuadrilla(nombre="Old", zona="Z", email="c@example.com", firebase_uid="u1")
    db_session.add(cuadrilla)
    db_session.commit()
    db_session.refresh(cuadrilla)

    update = CuadrillaUpdate(nombre="Nueva")
    current = {"type": "usuario"}

    result = auth_service.update_firebase_cuadrilla(cuadrilla.id, update, db_session, current)

    assert result.nombre == "Nueva"

def test_delete_firebase_cuadrilla(db_session, monkeypatch):
    cuadrilla = Cuadrilla(nombre="Del", zona="Z", email="d@example.com", firebase_uid="uid123")
    db_session.add(cuadrilla)
    db_session.commit()
    db_session.refresh(cuadrilla)

    monkeypatch.setattr(auth_service.auth, "delete_user", lambda uid: None)

    current = {"type": "usuario"}
    result = auth_service.delete_firebase_cuadrilla(cuadrilla.id, db_session, current)

    assert "eliminada" in result["message"]

def test_verify_user_token_invalid_token(db_session, monkeypatch):
    def mock_verify_id_token(token):
        raise Exception("bad token")

    monkeypatch.setattr(auth_service.auth, "verify_id_token", mock_verify_id_token)

    with pytest.raises(HTTPException) as exc_info:
        auth_service.verify_user_token("invalid", db_session)

    assert exc_info.value.status_code == 401

def test_create_firebase_user_missing_id_token(db_session):
    user_data = UserCreate(nombre="Nuevo", email="new@example.com", rol=Role.ENCARGADO, id_token="")
    current = {"type": "usuario", "data": {"rol": Role.ADMIN}}

    with pytest.raises(HTTPException) as exc_info:
        auth_service.create_firebase_user(user_data, db_session, current, None)

    assert exc_info.value.status_code == 400

def test_update_firebase_user_not_found(db_session):
    current = {"type": "usuario", "data": {"rol": Role.ADMIN}}
    update = UserUpdate(nombre="Nuevo")

    with pytest.raises(HTTPException) as exc_info:
        auth_service.update_firebase_user(999, update, db_session, current)

    assert exc_info.value.status_code == 404

def test_delete_firebase_user_not_found(db_session):
    current = {"type": "usuario", "data": {"rol": Role.ADMIN}}

    with pytest.raises(HTTPException) as exc_info:
        auth_service.delete_firebase_user(999, db_session, current)

    assert exc_info.value.status_code == 404

def test_create_firebase_cuadrilla_missing_id_token(db_session):
    data = CuadrillaCreate(nombre="C1", zona="Z", email="c@example.com", id_token="")
    current = {"type": "usuario"}

    with pytest.raises(HTTPException) as exc_info:
        auth_service.create_firebase_cuadrilla(data, db_session, current, None)

    assert exc_info.value.status_code == 400

def test_update_firebase_cuadrilla_not_found(db_session):
    update = CuadrillaUpdate(nombre="Nueva")
    current = {"type": "usuario"}

    with pytest.raises(HTTPException) as exc_info:
        auth_service.update_firebase_cuadrilla(999, update, db_session, current)

    assert exc_info.value.status_code == 404

def test_delete_firebase_cuadrilla_not_found(db_session):
    current = {"type": "usuario"}

    with pytest.raises(HTTPException) as exc_info:
        auth_service.delete_firebase_cuadrilla(999, db_session, current)

    assert exc_info.value.status_code == 404
