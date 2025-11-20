from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from src.api.models import Cliente, Sucursal
from src.services import sucursales as sucursales_service


@pytest.fixture
def cliente(db_session):
    cliente = Cliente(nombre="ACME", contacto="Jane", email="acme@example.com")
    db_session.add(cliente)
    db_session.commit()
    db_session.refresh(cliente)
    return cliente


@pytest.fixture
def auth_entity():
    return {"type": "usuario"}


@pytest.fixture
def firebase_spies(monkeypatch):
    spies = {
        "sync": MagicMock(),
        "update": MagicMock(),
        "delete": MagicMock(),
    }
    monkeypatch.setattr(sucursales_service, "_sync_firebase_sucursal", spies["sync"])
    monkeypatch.setattr(sucursales_service, "_update_firebase_sucursal", spies["update"])
    monkeypatch.setattr(sucursales_service, "_delete_firebase_sucursal", spies["delete"])
    return spies


def test_get_sucursales_by_cliente(db_session, cliente):
    otra = Cliente(nombre="Wayne", contacto="Bruce", email="wayne@example.com")
    db_session.add(otra)
    db_session.commit()

    sucursal = Sucursal(
        nombre="Centro",
        zona="Norte",
        direccion="Dir",
        superficie="100",
        cliente_id=cliente.id,
    )
    db_session.add(sucursal)
    db_session.commit()

    result = sucursales_service.get_sucursales_by_cliente(db_session, cliente.id)
    assert len(result) == 1
    assert result[0].cliente_id == cliente.id


def test_get_sucursal(db_session, cliente):
    sucursal = Sucursal(
        nombre="Centro",
        zona="Norte",
        direccion="Dir",
        superficie="100",
        cliente_id=cliente.id,
    )
    db_session.add(sucursal)
    db_session.commit()

    fetched = sucursales_service.get_sucursal(db_session, sucursal.id)
    assert fetched.id == sucursal.id


def test_get_sucursal_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        sucursales_service.get_sucursal(db_session, 999)
    assert exc.value.status_code == 404


def test_get_sucursales_by_cliente_missing_cliente(db_session):
    with pytest.raises(HTTPException) as exc:
        sucursales_service.get_sucursales_by_cliente(db_session, 999)
    assert exc.value.status_code == 404


def test_create_sucursal_persists_and_syncs(db_session, cliente, auth_entity, firebase_spies):
    sucursal = sucursales_service.create_sucursal(
        db_session,
        cliente.id,
        "Nueva",
        "Oeste",
        {"address": "Dir 1", "lat": 1.0, "lng": 2.0},
        "200",
        "Mensual",
        auth_entity,
    )
    assert sucursal.id is not None
    firebase_spies["sync"].assert_called_once()


def test_create_sucursal_requires_valid_direccion(db_session, cliente, auth_entity):
    with pytest.raises(HTTPException) as exc:
        sucursales_service.create_sucursal(
            db_session,
            cliente.id,
            "Nueva",
            "Oeste",
            "direccion",
            "200",
            None,
            auth_entity,
        )
    assert exc.value.status_code == 400


def test_create_sucursal_invalid_frecuencia(db_session, cliente, auth_entity):
    with pytest.raises(HTTPException) as exc:
        sucursales_service.create_sucursal(
            db_session,
            cliente.id,
            "Nueva",
            "Oeste",
            {"address": "Dir", "lat": 0, "lng": 0},
            "200",
            "Anual",
            auth_entity,
        )
    assert exc.value.status_code == 400


def test_update_sucursal_updates_fields(db_session, cliente, auth_entity, firebase_spies):
    sucursal = Sucursal(
        nombre="Existente",
        zona="Norte",
        direccion="Dir",
        superficie="100",
        cliente_id=cliente.id,
        frecuencia_preventivo="Mensual",
    )
    db_session.add(sucursal)
    db_session.commit()

    updated = sucursales_service.update_sucursal(
        db_session,
        sucursal.id,
        auth_entity,
        nombre="Actualizada",
        direccion={"address": "Nueva", "lat": 2.0, "lng": 3.0},
        frecuencia_preventivo="Trimestral",
        frecuencia_preventivo_provided=True,
    )

    assert updated.nombre == "Actualizada"
    assert updated.frecuencia_preventivo == "Trimestral"
    firebase_spies["update"].assert_called_once()


def test_update_sucursal_changes_cliente(db_session, cliente, auth_entity, firebase_spies):
    nuevo_cliente = Cliente(nombre="Wayne", contacto="Bruce", email="wayne@example.com")
    db_session.add(nuevo_cliente)
    db_session.commit()

    sucursal = Sucursal(
        nombre="Existente",
        zona="Norte",
        direccion="Dir",
        superficie="100",
        cliente_id=cliente.id,
    )
    db_session.add(sucursal)
    db_session.commit()

    updated = sucursales_service.update_sucursal(
        db_session,
        sucursal.id,
        auth_entity,
        cliente_id=nuevo_cliente.id,
    )
    assert updated.cliente_id == nuevo_cliente.id
    firebase_spies["update"].assert_called_once()


def test_delete_sucursal_calls_firebase(db_session, cliente, auth_entity, firebase_spies):
    sucursal = Sucursal(
        nombre="Existente",
        zona="Norte",
        direccion="Dir",
        superficie="100",
        cliente_id=cliente.id,
    )
    db_session.add(sucursal)
    db_session.commit()

    sucursal_id = sucursal.id
    response = sucursales_service.delete_sucursal(db_session, sucursal_id, auth_entity)
    assert "eliminada" in response["message"]
    firebase_spies["delete"].assert_called_once_with(sucursal_id)


def test_create_sucursal_requires_auth(db_session, cliente):
    with pytest.raises(HTTPException) as exc:
        sucursales_service.create_sucursal(
            db_session,
            cliente.id,
            "Nueva",
            "Oeste",
            {"address": "Dir", "lat": 0, "lng": 0},
            "100",
            None,
            None,
        )
    assert exc.value.status_code == 401


def test_delete_sucursal_requires_usuario(db_session, cliente):
    sucursal = Sucursal(
        nombre="Existente",
        zona="Norte",
        direccion="Dir",
        superficie="100",
        cliente_id=cliente.id,
    )
    db_session.add(sucursal)
    db_session.commit()

    with pytest.raises(HTTPException) as exc:
        sucursales_service.delete_sucursal(db_session, sucursal.id, {"type": "otro"})
    assert exc.value.status_code == 403
