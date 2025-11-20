import pytest
from fastapi import HTTPException

from src.api.models import Cliente, Sucursal
from src.services import clientes as clientes_service


@pytest.fixture
def auth_entity():
    return {"type": "usuario", "data": {"id": 1}}


@pytest.fixture
def sample_cliente(db_session):
    cliente = Cliente(nombre="ACME", contacto="Jane", email="acme@example.com")
    db_session.add(cliente)
    db_session.commit()
    db_session.refresh(cliente)
    return cliente


@pytest.fixture
def mock_clientes_firebase(monkeypatch):
    deleted = []

    class DummyRef:
        def __init__(self, path):
            self.path = path

        def delete(self):
            deleted.append(self.path)

    monkeypatch.setattr(clientes_service, "initialize_firebase", lambda: None)
    monkeypatch.setattr(clientes_service.db, "reference", lambda path: DummyRef(path))
    return deleted


def test_get_clientes_returns_all(db_session):
    db_session.add_all(
        [
            Cliente(nombre="ACME", contacto="Jane", email="one@example.com"),
            Cliente(nombre="Wayne", contacto="Bruce", email="two@example.com"),
        ]
    )
    db_session.commit()

    result = clientes_service.get_clientes(db_session)

    assert len(result) == 2
    assert {c.nombre for c in result} == {"ACME", "Wayne"}


def test_get_cliente_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        clientes_service.get_cliente(db_session, 999)
    assert exc.value.status_code == 404


def test_create_cliente_requires_auth(db_session):
    with pytest.raises(HTTPException) as exc:
        clientes_service.create_cliente(db_session, "ACME", "Jane", "acme@example.com", None)
    assert exc.value.status_code == 401


def test_create_cliente_persists_record(db_session, auth_entity):
    cliente = clientes_service.create_cliente(db_session, "ACME", "Jane", "acme@example.com", auth_entity)
    assert cliente.id is not None
    stored = clientes_service.get_cliente(db_session, cliente.id)
    assert stored.nombre == "ACME"


def test_update_cliente_updates_fields(db_session, sample_cliente, auth_entity):
    updated = clientes_service.update_cliente(
        db_session,
        sample_cliente.id,
        auth_entity,
        nombre="Nuevo",
        contacto="Juan",
    )
    assert updated.nombre == "Nuevo"
    assert updated.contacto == "Juan"


def test_update_cliente_requires_auth(db_session, sample_cliente):
    with pytest.raises(HTTPException) as exc:
        clientes_service.update_cliente(db_session, sample_cliente.id, None, nombre="Nuevo")
    assert exc.value.status_code == 401


def test_delete_cliente_removes_related_sucursales(db_session, sample_cliente, auth_entity, mock_clientes_firebase):
    sucursal_a = Sucursal(
        nombre="Central",
        zona="Norte",
        direccion="Dir 1",
        superficie="100",
        cliente_id=sample_cliente.id,
    )
    sucursal_b = Sucursal(
        nombre="Sur",
        zona="Sur",
        direccion="Dir 2",
        superficie="200",
        cliente_id=sample_cliente.id,
    )
    db_session.add_all([sucursal_a, sucursal_b])
    db_session.commit()

    existing_ids = {sucursal_a.id, sucursal_b.id}
    response = clientes_service.delete_cliente(db_session, sample_cliente.id, auth_entity)

    assert "eliminado" in response["message"]
    assert clientes_service.get_clientes(db_session) == []
    assert set(mock_clientes_firebase) == {f"/sucursales/{sid}" for sid in existing_ids}


def test_delete_cliente_requires_auth(db_session, sample_cliente):
    with pytest.raises(HTTPException) as exc:
        clientes_service.delete_cliente(db_session, sample_cliente.id, None)
    assert exc.value.status_code == 401
