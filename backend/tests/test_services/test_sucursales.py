import pytest
from fastapi import HTTPException
from src.services import sucursales as sucursales_service

@pytest.fixture
def mock_firebase(monkeypatch):
    monkeypatch.setattr(sucursales_service, "initialize_firebase", lambda: None)

    class DummyRef:
        def set(self, data):
            pass

        def update(self, data):
            pass

        def delete(self):
            pass

    monkeypatch.setattr(sucursales_service.db, "reference", lambda *args, **kwargs: DummyRef())

def test_get_sucursales(db_session, mock_firebase):
    sucursales_service.create_sucursal(
        db_session,
        "S1",
        "Z1",
        {"address": "A1", "lat": 1.0, "lng": 1.0},
        "1",
        {"type": "usuario"},
    )
    sucursales_service.create_sucursal(
        db_session,
        "S2",
        "Z2",
        {"address": "A2", "lat": 1.0, "lng": 1.0},
        "2",
        {"type": "usuario"},
    )

    sucursales = sucursales_service.get_sucursales(db_session)
    assert len(sucursales) == 2

def test_get_sucursal(db_session, mock_firebase):
    nueva_sucursal = sucursales_service.create_sucursal(
        db_session,
        "S",
        "Z",
        {"address": "A", "lat": 1.0, "lng": 1.0},
        "1",
        {"type": "usuario"},
    )
    sucursal = sucursales_service.get_sucursal(db_session, nueva_sucursal.id)
    assert sucursal.nombre == "S"

def test_create_sucursal(db_session, mock_firebase):
    sucursal = sucursales_service.create_sucursal(
        db_session=db_session,
        nombre="S",
        zona="Z",
        direccion={"address": "A", "lat": 1.0, "lng": 1.0},
        superficie="1",
        current_entity={"type": "usuario"},
    )
    assert sucursal.id is not None
    assert sucursal.nombre == "S"

def test_update_sucursal(db_session, mock_firebase):
    nueva_sucursal = sucursales_service.create_sucursal(
        db_session,
        "S1",
        "Z1",
        {"address": "A1", "lat": 1.0, "lng": 1.0},
        "1",
        {"type": "usuario"},
    )
    actualizada = sucursales_service.update_sucursal(
        db_session,
        nueva_sucursal.id,
        {"type": "usuario"},
        nombre="S2",
        zona="Z2",
        direccion={"address": "A2", "lat": 2.0, "lng": 2.0},
        superficie="2"
    )
    assert actualizada.nombre == "S2"
    assert actualizada.zona == "Z2"

def test_delete_sucursal(db_session, mock_firebase):
    nueva_sucursal = sucursales_service.create_sucursal(
        db_session,
        "S",
        "Z",
        {"address": "A", "lat": 1.0, "lng": 1.0},
        "1",
        {"type": "usuario"},
    )
    response = sucursales_service.delete_sucursal(db_session, nueva_sucursal.id, {"type": "usuario"})
    assert response["message"] == f"Sucursal con id {nueva_sucursal.id} eliminada"

    with pytest.raises(Exception):
        sucursales_service.get_sucursal(db_session, nueva_sucursal.id)

def test_create_sucursal_without_auth(db_session):
    with pytest.raises(HTTPException) as exc:
        sucursales_service.create_sucursal(
            db_session,
            "Sucursal Fail",
            "Zona",
            {"address": "Dirección", "lat": 0, "lng": 0},
            "100m2",
            None,
        )
    assert exc.value.status_code == 401

def test_create_sucursal_invalid_direccion(db_session):
    with pytest.raises(HTTPException) as exc:
        sucursales_service.create_sucursal(
            db_session,
            "Sucursal Fail",
            "Zona",
            "no es un dict",
            "100m2",
            {"type": "usuario"},
        )
    assert exc.value.status_code == 400

def test_update_sucursal_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        sucursales_service.update_sucursal(
            db_session,
            999,
            {"type": "usuario"},
            nombre="Nueva",
        )
    assert exc.value.status_code == 404

def test_delete_sucursal_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        sucursales_service.delete_sucursal(
            db_session,
            999,
            {"type": "usuario"},
        )
    assert exc.value.status_code == 404

def test_get_sucursales_empty(db_session):
    assert sucursales_service.get_sucursales(db_session) == []

def test_get_sucursal_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        sucursales_service.get_sucursal(db_session, 999)
    assert exc.value.status_code == 404

def test_create_sucursal_forbidden(db_session):
    with pytest.raises(HTTPException) as exc:
        sucursales_service.create_sucursal(
            db_session,
            "S", "Z",
            {"address": "A", "lat": 0, "lng": 0},
            "1",
            {"type": "otro"},
        )
    assert exc.value.status_code == 403

def test_update_sucursal_without_auth(db_session):
    with pytest.raises(HTTPException) as exc:
        sucursales_service.update_sucursal(db_session, 1, None, nombre="N")
    assert exc.value.status_code == 401

def test_update_sucursal_forbidden(db_session):
    with pytest.raises(HTTPException) as exc:
        sucursales_service.update_sucursal(db_session, 1, {"type": "otro"}, nombre="N")
    assert exc.value.status_code == 403

def test_delete_sucursal_without_auth(db_session):
    with pytest.raises(HTTPException) as exc:
        sucursales_service.delete_sucursal(db_session, 1, None)
    assert exc.value.status_code == 401

def test_delete_sucursal_forbidden(db_session):
    with pytest.raises(HTTPException) as exc:
        sucursales_service.delete_sucursal(db_session, 1, {"type": "otro"})
    assert exc.value.status_code == 403
