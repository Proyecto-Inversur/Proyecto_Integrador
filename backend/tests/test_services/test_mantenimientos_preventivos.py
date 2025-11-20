import asyncio
from datetime import UTC, date, datetime
from unittest.mock import AsyncMock, MagicMock

import pytest
from fastapi import HTTPException

from src.api.models import (
    Cliente,
    Cuadrilla,
    MantenimientoPreventivo,
    MantenimientoPreventivoFoto,
    MantenimientoPreventivoPlanilla,
    Sucursal,
)
from src.services import mantenimientos_preventivos as mp


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
        frecuencia_preventivo="Mensual",
    )
    db_session.add(sucursal)
    db_session.commit()
    db_session.refresh(sucursal)
    return sucursal


@pytest.fixture
def cuadrilla(db_session):
    cuadrilla = Cuadrilla(nombre="C1", zona="Norte", email="c1@example.com", firebase_uid="uid-1")
    db_session.add(cuadrilla)
    db_session.commit()
    db_session.refresh(cuadrilla)
    return cuadrilla


@pytest.fixture
def preventivo(db_session, cliente, sucursal, cuadrilla):
    record = MantenimientoPreventivo(
        cliente_id=cliente.id,
        sucursal_id=sucursal.id,
        frecuencia="Mensual",
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date(2024, 1, 1),
        estado="Pendiente",
    )
    db_session.add(record)
    db_session.commit()
    db_session.refresh(record)
    return record


@pytest.fixture
def preventivo_integrations(monkeypatch):
    patches = {
        "append": MagicMock(),
        "update": MagicMock(),
        "delete": MagicMock(),
        "upload": AsyncMock(return_value="https://files.local/resource"),
        "delete_file": MagicMock(return_value=True),
        "notify": AsyncMock(),
    }
    monkeypatch.setattr(mp, "append_preventivo", patches["append"])
    monkeypatch.setattr(mp, "update_preventivo", patches["update"])
    monkeypatch.setattr(mp, "delete_preventivo", patches["delete"])
    monkeypatch.setattr(mp, "upload_file_to_gcloud", patches["upload"])
    monkeypatch.setattr(mp, "delete_file_in_folder", patches["delete_file"])
    monkeypatch.setattr(mp, "notify_users_preventivo", patches["notify"])
    monkeypatch.setattr(mp, "GOOGLE_CLOUD_BUCKET_NAME", "test-bucket")
    return patches


def test_create_preventivo_success(db_session, cliente, sucursal, cuadrilla, auth_entity, preventivo_integrations):
    mantenimiento = asyncio.run(
        mp.create_mantenimiento_preventivo(
            db_session,
            cliente.id,
            sucursal.id,
            "Mensual",
            cuadrilla.id,
            date(2024, 1, 1),
            "Pendiente",
            auth_entity,
        )
    )
    assert mantenimiento.frecuencia == "Mensual"
    preventivo_integrations["append"].assert_called_once()


def test_create_preventivo_mismatched_frequency(db_session, cliente, sucursal, cuadrilla, auth_entity):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            mp.create_mantenimiento_preventivo(
                db_session,
                cliente.id,
                sucursal.id,
                "Trimestral",
                cuadrilla.id,
                date(2024, 1, 1),
                "Pendiente",
                auth_entity,
            )
        )
    assert exc.value.status_code == 400


def test_create_preventivo_requires_auth(db_session, cliente, sucursal, cuadrilla):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            mp.create_mantenimiento_preventivo(
                db_session,
                cliente.id,
                sucursal.id,
                "Mensual",
                cuadrilla.id,
                date(2024, 1, 1),
                "Pendiente",
                None,
            )
        )
    assert exc.value.status_code == 401


def test_update_preventivo_handles_files_and_notifications(
    db_session, preventivo, cliente, sucursal, cuadrilla, auth_entity, preventivo_integrations
):
    extendido = datetime.now(UTC)
    updated = asyncio.run(
        mp.update_mantenimiento_preventivo(
            db_session,
            preventivo.id,
            auth_entity,
            cliente_id=cliente.id,
            sucursal_id=sucursal.id,
            frecuencia="Mensual",
            id_cuadrilla=cuadrilla.id,
            fecha_cierre=date(2024, 2, 1),
            planillas=[MagicMock(filename="planilla.pdf")],
            fotos=[MagicMock(filename="foto.jpg")],
            extendido=extendido,
            estado="En Progreso",
        )
    )
    assert updated.fecha_cierre == date(2024, 2, 1)
    assert updated.extendido == extendido.replace(tzinfo=None)
    assert db_session.query(MantenimientoPreventivoPlanilla).count() == 1
    assert db_session.query(MantenimientoPreventivoFoto).count() == 1
    assert preventivo_integrations["notify"].await_count >= 1
    preventivo_integrations["update"].assert_called_once()


def test_update_preventivo_not_found(db_session, auth_entity):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            mp.update_mantenimiento_preventivo(
                db_session,
                999,
                auth_entity,
            )
        )
    assert exc.value.status_code == 404


def test_delete_preventivo_calls_sheet_cleanup(db_session, preventivo, auth_entity, preventivo_integrations):
    record_id = preventivo.id
    response = mp.delete_mantenimiento_preventivo(db_session, record_id, auth_entity)
    assert "eliminado" in response["message"]
    preventivo_integrations["delete"].assert_called_once_with(record_id)


def test_delete_preventivo_not_found(db_session, auth_entity):
    with pytest.raises(HTTPException) as exc:
        mp.delete_mantenimiento_preventivo(db_session, 999, auth_entity)
    assert exc.value.status_code == 404


def test_delete_planilla_removes_record(db_session, preventivo, auth_entity, preventivo_integrations):
    planilla = MantenimientoPreventivoPlanilla(mantenimiento_id=preventivo.id, url="https://files/planilla.pdf")
    db_session.add(planilla)
    db_session.commit()
    result = mp.delete_mantenimiento_planilla(db_session, preventivo.id, "planilla.pdf", auth_entity)
    assert result is True
    assert db_session.query(MantenimientoPreventivoPlanilla).count() == 0
    preventivo_integrations["delete_file"].assert_called_once()


def test_delete_photo_removes_record(db_session, preventivo, auth_entity, preventivo_integrations):
    foto = MantenimientoPreventivoFoto(mantenimiento_id=preventivo.id, url="https://files/foto.jpg")
    db_session.add(foto)
    db_session.commit()
    result = mp.delete_mantenimiento_photo(db_session, preventivo.id, "foto.jpg", auth_entity)
    assert result is True
    assert db_session.query(MantenimientoPreventivoFoto).count() == 0
    preventivo_integrations["delete_file"].assert_called_once()


def test_get_mantenimientos_preventivos_returns_list(db_session, preventivo):
    result = mp.get_mantenimientos_preventivos(db_session)
    assert len(result) == 1
    assert result[0].id == preventivo.id


def test_get_mantenimiento_preventivo_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        mp.get_mantenimiento_preventivo(db_session, 999)
    assert exc.value.status_code == 404
