from unittest.mock import patch, AsyncMock
import asyncio
from datetime import date
import pytest
from fastapi import HTTPException
from src.services import mantenimientos_correctivos as mc
from src.api.models import Sucursal, Cuadrilla, MantenimientoCorrectivo, MantenimientoCorrectivoFoto

@patch("src.services.mantenimientos_correctivos.notify_user")
@patch("src.services.mantenimientos_correctivos.notify_users_correctivo", new_callable=AsyncMock)
@patch("src.services.mantenimientos_correctivos.append_correctivo")
def test_create_correctivo(mock_append, mock_notify_users, mock_notify_user, db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com", firebase_uid="uid")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    result = asyncio.run(
        mc.create_mantenimiento_correctivo(
            db_session,
            id_sucursal=sucursal.id,
            id_cuadrilla=cuadrilla.id,
            fecha_apertura=date.today(),
            numero_caso="1",
            incidente="inc",
            rubro="rubro",
            estado="abierto",
            prioridad="baja",
            current_entity={"type": "usuario"},
        )
    )

    assert result.numero_caso == "1"

@patch("src.services.mantenimientos_correctivos.notify_user")
@patch("src.services.mantenimientos_correctivos.notify_users_correctivo", new_callable=AsyncMock)
@patch("src.services.mantenimientos_correctivos.append_correctivo")
def test_create_correctivo_sucursal_not_found(mock_append, mock_notify_users, mock_notify_user, db_session):
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com", firebase_uid="uid")
    db_session.add(cuadrilla)
    db_session.commit()

    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            mc.create_mantenimiento_correctivo(
                db_session,
                id_sucursal=999,
                id_cuadrilla=cuadrilla.id,
                fecha_apertura=date.today(),
                numero_caso="1",
                incidente="inc",
                rubro="rubro",
                estado="abierto",
                prioridad="baja",
                current_entity={"type": "usuario"},
            )
        )

    assert exc.value.status_code == 404

@patch("src.services.mantenimientos_correctivos.notify_user")
@patch("src.services.mantenimientos_correctivos.notify_users_correctivo", new_callable=AsyncMock)
@patch("src.services.mantenimientos_correctivos.append_correctivo")
@patch("src.services.mantenimientos_correctivos.delete_correctivo")
def test_delete_correctivo(mock_delete_correctivo, mock_append, mock_notify_users, mock_notify_user, db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com", firebase_uid="uid")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    mantenimiento = asyncio.run(
        mc.create_mantenimiento_correctivo(
            db_session,
            sucursal.id,
            cuadrilla.id,
            date.today(),
            "1",
            "inc",
            "rubro",
            "abierto",
            "baja",
            {"type": "usuario"},
        )
    )

    result = mc.delete_mantenimiento_correctivo(db_session, mantenimiento.id, {"type": "usuario"})

    assert "eliminado" in result["message"]

def test_delete_correctivo_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        mc.delete_mantenimiento_correctivo(db_session, 999, {"type": "usuario"})

    assert exc.value.status_code == 404

def test_get_mantenimientos_correctivos(db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com", firebase_uid="uid")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    mantenimiento = MantenimientoCorrectivo(
        id_sucursal=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
        numero_caso="1",
        incidente="inc",
        rubro="rubro",
        estado="abierto",
        prioridad="baja",
    )
    db_session.add(mantenimiento)
    db_session.commit()

    result = mc.get_mantenimientos_correctivos(db_session)

    assert len(result) == 1
    assert result[0].numero_caso == "1"

def test_get_mantenimiento_correctivo(db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com", firebase_uid="uid")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    mantenimiento = MantenimientoCorrectivo(
        id_sucursal=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
        numero_caso="1",
        incidente="inc",
        rubro="rubro",
        estado="abierto",
        prioridad="baja",
    )
    db_session.add(mantenimiento)
    db_session.commit()

    result = mc.get_mantenimiento_correctivo(db_session, mantenimiento.id)

    assert result.id == mantenimiento.id

def test_get_mantenimiento_correctivo_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        mc.get_mantenimiento_correctivo(db_session, 999)

    assert exc.value.status_code == 404

@patch("src.services.mantenimientos_correctivos.notify_user")
@patch("src.services.mantenimientos_correctivos.notify_users_correctivo", new_callable=AsyncMock)
@patch("src.services.mantenimientos_correctivos.update_correctivo")
def test_update_mantenimiento_correctivo(
    mock_update, mock_notify_users, mock_notify_user, db_session
):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com", firebase_uid="uid")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    mantenimiento = MantenimientoCorrectivo(
        id_sucursal=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
        numero_caso="1",
        incidente="inc",
        rubro="rubro",
        estado="abierto",
        prioridad="baja",
    )
    db_session.add(mantenimiento)
    db_session.commit()

    updated = asyncio.run(
        mc.update_mantenimiento_correctivo(
            db_session,
            mantenimiento.id,
            {"type": "usuario"},
            incidente="nuevo",
            prioridad="Alta",
        )
    )

    assert updated.incidente == "nuevo"
    assert updated.prioridad == "Alta"

@patch("src.services.mantenimientos_correctivos.update_correctivo")
def test_update_mantenimiento_correctivo_not_found(mock_update, db_session):
    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            mc.update_mantenimiento_correctivo(
                db_session,
                999,
                {"type": "usuario"},
                incidente="nuevo",
            )
        )

    assert exc.value.status_code == 404

@patch("src.services.mantenimientos_correctivos.update_correctivo")
@patch("src.services.mantenimientos_correctivos.delete_file_in_folder")
def test_delete_mantenimiento_planilla(mock_delete_file, mock_update, db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com", firebase_uid="uid")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    mantenimiento = MantenimientoCorrectivo(
        id_sucursal=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
        numero_caso="1",
        incidente="inc",
        rubro="rubro",
        planilla="planilla.png",
        estado="abierto",
        prioridad="baja",
    )
    db_session.add(mantenimiento)
    db_session.commit()

    result = mc.delete_mantenimiento_planilla(
        db_session, mantenimiento.id, "planilla.png", {"type": "usuario"}
    )

    db_refresh = db_session.get(MantenimientoCorrectivo, mantenimiento.id)
    assert result is True
    assert db_refresh.planilla is None

def test_delete_mantenimiento_planilla_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        mc.delete_mantenimiento_planilla(db_session, 999, "planilla.png", {"type": "usuario"})

    assert exc.value.status_code == 404

@patch("src.services.mantenimientos_correctivos.update_correctivo")
@patch("src.services.mantenimientos_correctivos.delete_file_in_folder")
def test_delete_mantenimiento_photo(mock_delete_file, mock_update, db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com", firebase_uid="uid")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    mantenimiento = MantenimientoCorrectivo(
        id_sucursal=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
        numero_caso="1",
        incidente="inc",
        rubro="rubro",
        estado="abierto",
        prioridad="baja",
    )
    db_session.add(mantenimiento)
    db_session.commit()

    foto = MantenimientoCorrectivoFoto(
        mantenimiento_id=mantenimiento.id, url="http://example.com/foto.jpg"
    )
    db_session.add(foto)
    db_session.commit()

    result = mc.delete_mantenimiento_photo(
        db_session, mantenimiento.id, "foto.jpg", {"type": "usuario"}
    )

    remaining = (
        db_session.query(MantenimientoCorrectivoFoto)
        .filter_by(mantenimiento_id=mantenimiento.id)
        .all()
    )
    assert result is True
    assert len(remaining) == 0

@patch("src.services.mantenimientos_correctivos.update_correctivo")
@patch("src.services.mantenimientos_correctivos.delete_file_in_folder")
def test_delete_mantenimiento_photo_not_found(mock_delete_file, mock_update, db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com", firebase_uid="uid")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    mantenimiento = MantenimientoCorrectivo(
        id_sucursal=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
        numero_caso="1",
        incidente="inc",
        rubro="rubro",
        estado="abierto",
        prioridad="baja",
    )
    db_session.add(mantenimiento)
    db_session.commit()

    with pytest.raises(HTTPException) as exc:
        mc.delete_mantenimiento_photo(
            db_session, mantenimiento.id, "missing.jpg", {"type": "usuario"}
        )

    assert exc.value.status_code == 404
