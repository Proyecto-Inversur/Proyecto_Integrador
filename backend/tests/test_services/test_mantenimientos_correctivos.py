import asyncio
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from src.api.models import (
    Cliente,
    Cuadrilla,
    MantenimientoCorrectivo,
    MantenimientoCorrectivoFoto,
    Sucursal,
)
from src.services import mantenimientos_correctivos as mc


@pytest.fixture
def auth_entity():
    return {"type": "usuario"}


@pytest.fixture
def cliente(db_session):
    cliente = Cliente(nombre="ACME", contacto="Jane", email="acme@example.com")
    db_session.add(cliente)
    db_session.commit()
    db_session.refresh(cliente)
    return cliente


@pytest.fixture
def sucursal(db_session, cliente):
    sucursal = Sucursal(
        nombre="Central",
        zona="Norte",
        direccion="Dir",
        superficie="100",
        cliente_id=cliente.id,
    )
    db_session.add(sucursal)
    db_session.commit()
    db_session.refresh(sucursal)
    return sucursal


@pytest.fixture
def cuadrilla(db_session):
    cuadrilla = Cuadrilla(nombre="C1", zona="Norte", email="c1@example.com", firebase_uid="uid-123")
    db_session.add(cuadrilla)
    db_session.commit()
    db_session.refresh(cuadrilla)
    return cuadrilla


@pytest.fixture
def correctivo_integrations(monkeypatch):
    patches = {
        "append": MagicMock(),
        "update": MagicMock(),
        "delete": MagicMock(),
        "upload": AsyncMock(return_value="https://files.local/resource"),
        "delete_file": MagicMock(return_value=True),
        "notify_user": MagicMock(),
        "notify_users": AsyncMock(),
    }
    monkeypatch.setattr(mc, "append_correctivo", patches["append"])
    monkeypatch.setattr(mc, "update_correctivo", patches["update"])
    monkeypatch.setattr(mc, "delete_correctivo", patches["delete"])
    monkeypatch.setattr(mc, "upload_file_to_gcloud", patches["upload"])
    monkeypatch.setattr(mc, "delete_file_in_folder", patches["delete_file"])
    monkeypatch.setattr(mc, "notify_user", patches["notify_user"])
    monkeypatch.setattr(mc, "notify_users_correctivo", patches["notify_users"])
    monkeypatch.setattr(mc, "GOOGLE_CLOUD_BUCKET_NAME", "test-bucket")
    return patches


@pytest.fixture
def correctivo(db_session, cliente, sucursal, cuadrilla):
    record = MantenimientoCorrectivo(
        cliente_id=cliente.id,
        sucursal_id=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date(2024, 1, 1),
        numero_caso="NC-1",
        incidente="Incidente",
        rubro="Otros",
        estado="Pendiente",
        prioridad="Media",
    )
    db_session.add(record)
    db_session.commit()
    db_session.refresh(record)
    return record


def test_create_correctivo_high_priority_notifies(db_session, cliente, sucursal, cuadrilla, auth_entity, correctivo_integrations):
    result = asyncio.run(
        mc.create_mantenimiento_correctivo(
            db_session,
            cliente.id,
            sucursal.id,
            cuadrilla.id,
            date(2024, 1, 1),
            "NC-1",
            "Incidente",
            "Otros",
            "Pendiente",
            "Alta",
            auth_entity,
        )
    )
    assert result.numero_caso == "NC-1"
    correctivo_integrations["notify_user"].assert_called_once()
    assert correctivo_integrations["append"].called


def test_create_correctivo_requires_matching_cliente(db_session, sucursal, cuadrilla, auth_entity):
    other_cliente = Cliente(nombre="Wayne", contacto="Bruce", email="wayne@example.com")
    db_session.add(other_cliente)
    db_session.commit()
    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            mc.create_mantenimiento_correctivo(
                db_session,
                other_cliente.id,
                sucursal.id,
                cuadrilla.id,
                date(2024, 1, 1),
                "NC",
                "Incidente",
                "Otros",
                "Pendiente",
                "Media",
                auth_entity,
            )
        )
    assert exc.value.status_code == 400


def test_create_correctivo_requires_auth(db_session, cliente, sucursal, cuadrilla):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            mc.create_mantenimiento_correctivo(
                db_session,
                cliente.id,
                sucursal.id,
                cuadrilla.id,
                date(2024, 1, 1),
                "NC",
                "Incidente",
                "Otros",
                "Pendiente",
                "Baja",
                None,
            )
        )
    assert exc.value.status_code == 401


def test_update_correctivo_handles_files_and_notifications(db_session, correctivo, cuadrilla, auth_entity, correctivo_integrations):
    extendido = datetime.now(UTC)
    updated = asyncio.run(
        mc.update_mantenimiento_correctivo(
            db_session,
            correctivo.id,
            auth_entity,
            estado="Solucionado",
            prioridad="Alta",
            extendido=extendido,
            planilla=MagicMock(filename="planilla.pdf"),
            fotos=[MagicMock(filename="foto.jpg")],
        )
    )
    assert updated.estado == "Solucionado"
    assert updated.extendido == extendido.replace(tzinfo=None)
    assert db_session.query(MantenimientoCorrectivoFoto).filter_by(mantenimiento_id=correctivo.id).count() == 1
    assert correctivo_integrations["notify_users"].await_count >= 1
    correctivo_integrations["update"].assert_called_once()


def test_update_correctivo_not_found(db_session, auth_entity):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            mc.update_mantenimiento_correctivo(
                db_session,
                999,
                auth_entity,
                estado="Solucionado",
            )
        )
    assert exc.value.status_code == 404


def test_delete_correctivo_calls_sheet_cleanup(db_session, correctivo, auth_entity, correctivo_integrations):
    record_id = correctivo.id
    response = mc.delete_mantenimiento_correctivo(db_session, record_id, auth_entity)
    assert "eliminado" in response["message"]
    correctivo_integrations["delete"].assert_called_once_with(record_id)


def test_delete_correctivo_not_found(db_session, auth_entity):
    with pytest.raises(HTTPException) as exc:
        mc.delete_mantenimiento_correctivo(db_session, 999, auth_entity)
    assert exc.value.status_code == 404


def test_delete_planilla_removes_value(db_session, correctivo, auth_entity, correctivo_integrations):
    correctivo.planilla = "https://files/planilla.pdf"
    db_session.commit()
    result = mc.delete_mantenimiento_planilla(db_session, correctivo.id, "planilla.pdf", auth_entity)
    assert result is True
    assert correctivo.planilla is None
    correctivo_integrations["delete_file"].assert_called_once()


def test_delete_photo_removes_entry(db_session, correctivo, auth_entity, correctivo_integrations):
    foto = MantenimientoCorrectivoFoto(mantenimiento_id=correctivo.id, url="https://files/foto.jpg")
    db_session.add(foto)
    db_session.commit()
    result = mc.delete_mantenimiento_photo(db_session, correctivo.id, "foto.jpg", auth_entity)
    assert result is True
    assert db_session.query(MantenimientoCorrectivoFoto).count() == 0
    correctivo_integrations["delete_file"].assert_called_once()


def test_delete_photo_not_found(db_session, correctivo, auth_entity):
    with pytest.raises(HTTPException) as exc:
        mc.delete_mantenimiento_photo(db_session, correctivo.id, "missing.jpg", auth_entity)
    assert exc.value.status_code == 404


def test_get_mantenimientos_correctivos_returns_list(db_session, correctivo):
    result = mc.get_mantenimientos_correctivos(db_session)
    assert len(result) == 1
    assert result[0].id == correctivo.id


def test_get_mantenimiento_correctivo_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        mc.get_mantenimiento_correctivo(db_session, 999)
    assert exc.value.status_code == 404
