from unittest.mock import patch, AsyncMock
import asyncio
from datetime import date
import pytest
from fastapi import HTTPException
from src.services import mantenimientos_preventivos as mp
from src.api.models import Sucursal, Preventivo, Cuadrilla, MantenimientoPreventivo, MantenimientoPreventivoPlanilla, MantenimientoPreventivoFoto

@patch("src.services.mantenimientos_preventivos.notify_users_preventivo", new_callable=AsyncMock)
@patch("src.services.mantenimientos_preventivos.append_preventivo")
def test_create_preventivo(mock_append, mock_notify, db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    db_session.add(sucursal)
    db_session.commit()

    preventivo = Preventivo(id_sucursal=sucursal.id, nombre_sucursal="S", frecuencia="Mensual")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com", firebase_uid="uid")
    db_session.add_all([preventivo, cuadrilla])
    db_session.commit()

    result = asyncio.run(
        mp.create_mantenimiento_preventivo(
            db_session,
            id_sucursal=sucursal.id,
            frecuencia="Mensual",
            id_cuadrilla=cuadrilla.id,
            fecha_apertura=date.today(),
            current_entity={"type": "usuario"},
        )
    )

    assert result.frecuencia == "Mensual"

@patch("src.services.mantenimientos_preventivos.notify_users_preventivo", new_callable=AsyncMock)
@patch("src.services.mantenimientos_preventivos.append_preventivo")
def test_create_preventivo_not_found(mock_append, mock_notify, db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com", firebase_uid="uid")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            mp.create_mantenimiento_preventivo(
                db_session,
                id_sucursal=sucursal.id,
                frecuencia="Mensual",
                id_cuadrilla=cuadrilla.id,
                fecha_apertura=date.today(),
                current_entity={"type": "usuario"},
            )
        )

    assert exc.value.status_code == 404

@patch("src.services.mantenimientos_preventivos.notify_users_preventivo", new_callable=AsyncMock)
@patch("src.services.mantenimientos_preventivos.append_preventivo")
@patch("src.services.mantenimientos_preventivos.delete_preventivo")
def test_delete_preventivo(mock_delete_preventivo, mock_append, mock_notify, db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    db_session.add(sucursal)
    db_session.commit()

    preventivo = Preventivo(id_sucursal=sucursal.id, nombre_sucursal="S", frecuencia="Mensual")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com", firebase_uid="uid")
    db_session.add_all([preventivo, cuadrilla])
    db_session.commit()

    mantenimiento = asyncio.run(
        mp.create_mantenimiento_preventivo(
            db_session,
            sucursal.id,
            "Mensual",
            cuadrilla.id,
            date.today(),
            {"type": "usuario"},
        )
    )

    result = mp.delete_mantenimiento_preventivo(db_session, mantenimiento.id, {"type": "usuario"})

    assert "eliminado" in result["message"]

def test_delete_preventivo_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        mp.delete_mantenimiento_preventivo(db_session, 999, {"type": "usuario"})

    assert exc.value.status_code == 404

def _create_basic_mantenimiento(db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    db_session.add(sucursal)
    db_session.commit()

    preventivo = Preventivo(
        id_sucursal=sucursal.id, nombre_sucursal="S", frecuencia="Mensual"
    )
    cuadrilla = Cuadrilla(
        nombre="C", zona="Z", email="c@example.com", firebase_uid="uid"
    )
    db_session.add_all([preventivo, cuadrilla])
    db_session.commit()

    mantenimiento = MantenimientoPreventivo(
        id_sucursal=sucursal.id,
        frecuencia="Mensual",
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
    )
    db_session.add(mantenimiento)
    db_session.commit()
    db_session.refresh(mantenimiento)
    return mantenimiento

def test_get_mantenimientos_preventivos(db_session):
    mantenimiento = _create_basic_mantenimiento(db_session)
    mantenimientos = mp.get_mantenimientos_preventivos(db_session)
    assert len(mantenimientos) == 1
    assert mantenimientos[0].id == mantenimiento.id

def test_get_mantenimiento_preventivo(db_session):
    mantenimiento = _create_basic_mantenimiento(db_session)
    fetched = mp.get_mantenimiento_preventivo(db_session, mantenimiento.id)
    assert fetched.id == mantenimiento.id

def test_get_mantenimiento_preventivo_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        mp.get_mantenimiento_preventivo(db_session, 999)

    assert exc.value.status_code == 404

@patch("src.services.mantenimientos_preventivos.update_preventivo")
def test_update_mantenimiento_preventivo(mock_update, db_session):
    mantenimiento = _create_basic_mantenimiento(db_session)
    updated = asyncio.run(
        mp.update_mantenimiento_preventivo(
            db_session,
            mantenimiento.id,
            {"type": "usuario"},
            frecuencia="Semanal",
        )
    )
    assert updated.frecuencia == "Semanal"

@patch("src.services.mantenimientos_preventivos.update_preventivo")
def test_update_mantenimiento_preventivo_not_found(mock_update, db_session):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            mp.update_mantenimiento_preventivo(
                db_session,
                999,
                {"type": "usuario"},
                frecuencia="Semanal",
            )
        )

    assert exc.value.status_code == 404

@patch("src.services.mantenimientos_preventivos.update_preventivo")
@patch("src.services.mantenimientos_preventivos.delete_file_in_folder")
def test_delete_mantenimiento_planilla(mock_delete_file, mock_update, db_session):
    mantenimiento = _create_basic_mantenimiento(db_session)
    planilla = MantenimientoPreventivoPlanilla(
        mantenimiento_id=mantenimiento.id,
        url="http://example.com/planilla.png",
    )
    db_session.add(planilla)
    db_session.commit()

    result = mp.delete_mantenimiento_planilla(
        db_session, mantenimiento.id, "planilla.png", {"type": "usuario"}
    )

    assert result is True
    assert (
        db_session.query(MantenimientoPreventivoPlanilla)
        .filter_by(mantenimiento_id=mantenimiento.id)
        .count()
        == 0
    )

@patch("src.services.mantenimientos_preventivos.update_preventivo")
@patch("src.services.mantenimientos_preventivos.delete_file_in_folder")
def test_delete_mantenimiento_planilla_not_found(mock_delete_file, mock_update, db_session):
    mantenimiento = _create_basic_mantenimiento(db_session)

    with pytest.raises(HTTPException) as exc:
        mp.delete_mantenimiento_planilla(
            db_session, mantenimiento.id, "planilla.png", {"type": "usuario"}
        )

    assert exc.value.status_code == 404

@patch("src.services.mantenimientos_preventivos.update_preventivo")
@patch("src.services.mantenimientos_preventivos.delete_file_in_folder")
def test_delete_mantenimiento_photo(mock_delete_file, mock_update, db_session):
    mantenimiento = _create_basic_mantenimiento(db_session)
    foto = MantenimientoPreventivoFoto(
        mantenimiento_id=mantenimiento.id, url="http://example.com/foto.jpg"
    )
    db_session.add(foto)
    db_session.commit()

    result = mp.delete_mantenimiento_photo(
        db_session, mantenimiento.id, "foto.jpg", {"type": "usuario"}
    )

    assert result is True
    assert (
        db_session.query(MantenimientoPreventivoFoto)
        .filter_by(mantenimiento_id=mantenimiento.id)
        .count()
        == 0
    )

@patch("src.services.mantenimientos_preventivos.update_preventivo")
@patch("src.services.mantenimientos_preventivos.delete_file_in_folder")
def test_delete_mantenimiento_photo_not_found(mock_delete_file, mock_update, db_session):
    mantenimiento = _create_basic_mantenimiento(db_session)

    with pytest.raises(HTTPException) as exc:
        mp.delete_mantenimiento_photo(
            db_session, mantenimiento.id, "foto.jpg", {"type": "usuario"}
        )

    assert exc.value.status_code == 404
