from datetime import date
import asyncio
import pytest
from fastapi import HTTPException
from src.services import maps as maps_service
from src.api.models import Sucursal, Cuadrilla, MantenimientoCorrectivo, CorrectivoSeleccionado, MantenimientoPreventivo, PreventivoSeleccionado

def test_get_correctivos(db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    mantenimiento = MantenimientoCorrectivo(
        id_sucursal=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
        numero_caso="1",
        incidente="inc",
        rubro="r",
        estado="abierto",
        prioridad="baja",
    )
    db_session.add(mantenimiento)
    db_session.commit()

    seleccion = CorrectivoSeleccionado(
        id_cuadrilla=cuadrilla.id,
        id_mantenimiento=mantenimiento.id,
        id_sucursal=sucursal.id,
    )
    db_session.add(seleccion)
    db_session.commit()

    result = maps_service.get_correctivos(db_session, cuadrilla.id, {"type": "usuario"})

    assert len(result) == 1
    assert result[0].id_mantenimiento == mantenimiento.id

def test_get_sucursales_locations(monkeypatch):
    class DummyRef:
        def get(self):
            return {
                "1": {"name": "Sucursal 1", "lat": 1.0, "lng": 2.0}
            }

    monkeypatch.setattr(maps_service.db, "reference", lambda path: DummyRef())

    result = asyncio.run(maps_service.get_sucursales_locations({"type": "usuario"}))

    assert len(result) == 1
    assert result[0].id == "1"
    assert result[0].name == "Sucursal 1"

def test_get_users_locations(monkeypatch):
    class DummyRef:
        def get(self):
            return {
                "u1": {
                    "id": "1",
                    "tipo": "t",
                    "name": "User 1",
                    "lat": 1.0,
                    "lng": 2.0,
                }
            }

    monkeypatch.setattr(maps_service.db, "reference", lambda path: DummyRef())

    result = asyncio.run(maps_service.get_users_locations({"type": "usuario"}))

    assert len(result) == 1
    assert result[0].id == "1"
    assert result[0].name == "User 1"

def test_get_preventivos(db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    mantenimiento = MantenimientoPreventivo(
        id_sucursal=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
    )
    db_session.add(mantenimiento)
    db_session.commit()

    seleccion = PreventivoSeleccionado(
        id_cuadrilla=cuadrilla.id,
        id_mantenimiento=mantenimiento.id,
        id_sucursal=sucursal.id,
    )
    db_session.add(seleccion)
    db_session.commit()

    result = maps_service.get_preventivos(db_session, cuadrilla.id, {"type": "usuario"})

    assert len(result) == 1
    assert result[0].id_mantenimiento == mantenimiento.id

def test_update_user_location(monkeypatch):
    class DummyRef:
        data = None

        def set(self, payload):
            DummyRef.data = payload

    monkeypatch.setattr(maps_service.db, "reference", lambda path: DummyRef())

    resp = asyncio.run(
        maps_service.update_user_location(
            {"type": "usuario"},
            "uid",
            "1",
            "tipo",
            "Name",
            1.0,
            2.0,
        )
    )

    assert resp == {"message": "Ubicación actualizada para 1"}
    assert DummyRef.data == {
        "id": "1",
        "tipo": "tipo",
        "name": "Name",
        "lat": 1.0,
        "lng": 2.0,
    }

def test_update_correctivo(db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    mantenimiento = MantenimientoCorrectivo(
        id_sucursal=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
        numero_caso="1",
        incidente="inc",
        rubro="r",
        estado="abierto",
        prioridad="baja",
    )
    db_session.add(mantenimiento)
    db_session.commit()

    result = maps_service.update_correctivo(
        db_session,
        cuadrilla.id,
        mantenimiento.id,
        sucursal.id,
        {"type": "usuario"},
    )

    assert result.id_cuadrilla == cuadrilla.id
    assert result.id_mantenimiento == mantenimiento.id

def test_update_preventivo(db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    mantenimiento = MantenimientoPreventivo(
        id_sucursal=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
    )
    db_session.add(mantenimiento)
    db_session.commit()

    result = maps_service.update_preventivo(
        db_session,
        cuadrilla.id,
        mantenimiento.id,
        sucursal.id,
        {"type": "usuario"},
    )

    assert result.id_cuadrilla == cuadrilla.id
    assert result.id_mantenimiento == mantenimiento.id

def test_delete_sucursal(db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    mant_c = MantenimientoCorrectivo(
        id_sucursal=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
        numero_caso="1",
        incidente="inc",
        rubro="r",
        estado="abierto",
        prioridad="baja",
    )
    mant_p = MantenimientoPreventivo(
        id_sucursal=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
    )
    db_session.add_all([mant_c, mant_p])
    db_session.commit()

    sel_c = CorrectivoSeleccionado(
        id_cuadrilla=cuadrilla.id,
        id_mantenimiento=mant_c.id,
        id_sucursal=sucursal.id,
    )
    sel_p = PreventivoSeleccionado(
        id_cuadrilla=cuadrilla.id,
        id_mantenimiento=mant_p.id,
        id_sucursal=sucursal.id,
    )
    db_session.add_all([sel_c, sel_p])
    db_session.commit()

    resp = maps_service.delete_sucursal(
        db_session, cuadrilla.id, sucursal.id, {"type": "usuario"}
    )

    assert resp == {"message": "Seleccion de sucursal eliminada"}
    assert db_session.query(CorrectivoSeleccionado).count() == 0
    assert db_session.query(PreventivoSeleccionado).count() == 0

def test_delete_correctivo(db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    mant_c = MantenimientoCorrectivo(
        id_sucursal=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
        numero_caso="1",
        incidente="inc",
        rubro="r",
        estado="abierto",
        prioridad="baja",
    )
    db_session.add(mant_c)
    db_session.commit()

    sel_c = CorrectivoSeleccionado(
        id_cuadrilla=cuadrilla.id,
        id_mantenimiento=mant_c.id,
        id_sucursal=sucursal.id,
    )
    db_session.add(sel_c)
    db_session.commit()

    resp = maps_service.delete_correctivo(
        db_session, cuadrilla.id, mant_c.id, {"type": "usuario"}
    )

    assert resp == {"message": "Seleccion de correctivo eliminada"}
    assert db_session.query(CorrectivoSeleccionado).count() == 0

def test_delete_preventivo(db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    mant_p = MantenimientoPreventivo(
        id_sucursal=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
    )
    db_session.add(mant_p)
    db_session.commit()

    sel_p = PreventivoSeleccionado(
        id_cuadrilla=cuadrilla.id,
        id_mantenimiento=mant_p.id,
        id_sucursal=sucursal.id,
    )
    db_session.add(sel_p)
    db_session.commit()

    resp = maps_service.delete_preventivo(
        db_session, cuadrilla.id, mant_p.id, {"type": "usuario"}
    )

    assert resp == {"message": "Seleccion de preventivo eliminada"}
    assert db_session.query(PreventivoSeleccionado).count() == 0

def test_delete_selection(db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    mant_c = MantenimientoCorrectivo(
        id_sucursal=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
        numero_caso="1",
        incidente="inc",
        rubro="r",
        estado="abierto",
        prioridad="baja",
    )
    mant_p = MantenimientoPreventivo(
        id_sucursal=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
    )
    db_session.add_all([mant_c, mant_p])
    db_session.commit()

    sel_c = CorrectivoSeleccionado(
        id_cuadrilla=cuadrilla.id,
        id_mantenimiento=mant_c.id,
        id_sucursal=sucursal.id,
    )
    sel_p = PreventivoSeleccionado(
        id_cuadrilla=cuadrilla.id,
        id_mantenimiento=mant_p.id,
        id_sucursal=sucursal.id,
    )
    db_session.add_all([sel_c, sel_p])
    db_session.commit()

    resp = maps_service.delete_selection(
        db_session, cuadrilla.id, {"type": "usuario"}
    )

    assert resp == {"message": "Seleccion eliminada"}
    assert db_session.query(CorrectivoSeleccionado).count() == 0
    assert db_session.query(PreventivoSeleccionado).count() == 0

def test_get_correctivos_unauthorized(db_session):
    with pytest.raises(HTTPException) as exc:
        maps_service.get_correctivos(db_session, 1, None)

    assert exc.value.status_code == 401

def test_get_sucursales_locations_unauthorized():
    with pytest.raises(HTTPException) as exc:
        asyncio.run(maps_service.get_sucursales_locations(None))

    assert exc.value.status_code == 401

def test_get_users_locations_forbidden():
    with pytest.raises(HTTPException) as exc:
        asyncio.run(maps_service.get_users_locations({"type": "admin"}))

    assert exc.value.status_code == 403

def test_get_preventivos_unauthorized(db_session):
    with pytest.raises(HTTPException) as exc:
        maps_service.get_preventivos(db_session, 1, None)

    assert exc.value.status_code == 401

def test_update_user_location_unauthorized():
    with pytest.raises(HTTPException) as exc:
        asyncio.run(
            maps_service.update_user_location(
                None,
                "uid",
                "1",
                "tipo",
                "Name",
                1.0,
                2.0,
            )
        )

    assert exc.value.status_code == 401

def test_update_correctivo_already_selected(db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    mantenimiento = MantenimientoCorrectivo(
        id_sucursal=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
        numero_caso="1",
        incidente="inc",
        rubro="r",
        estado="abierto",
        prioridad="baja",
    )
    db_session.add(mantenimiento)
    db_session.commit()

    seleccion = CorrectivoSeleccionado(
        id_cuadrilla=cuadrilla.id,
        id_mantenimiento=mantenimiento.id,
        id_sucursal=sucursal.id,
    )
    db_session.add(seleccion)
    db_session.commit()

    with pytest.raises(HTTPException) as exc:
        maps_service.update_correctivo(
            db_session,
            cuadrilla.id,
            mantenimiento.id,
            sucursal.id,
            {"type": "usuario"},
        )

    assert exc.value.status_code == 400

def test_update_preventivo_already_selected(db_session):
    sucursal = Sucursal(nombre="S", zona="Z", direccion="D", superficie="1")
    cuadrilla = Cuadrilla(nombre="C", zona="Z", email="c@example.com")
    db_session.add_all([sucursal, cuadrilla])
    db_session.commit()

    mantenimiento = MantenimientoPreventivo(
        id_sucursal=sucursal.id,
        id_cuadrilla=cuadrilla.id,
        fecha_apertura=date.today(),
    )
    db_session.add(mantenimiento)
    db_session.commit()

    seleccion = PreventivoSeleccionado(
        id_cuadrilla=cuadrilla.id,
        id_mantenimiento=mantenimiento.id,
        id_sucursal=sucursal.id,
    )
    db_session.add(seleccion)
    db_session.commit()

    with pytest.raises(HTTPException) as exc:
        maps_service.update_preventivo(
            db_session,
            cuadrilla.id,
            mantenimiento.id,
            sucursal.id,
            {"type": "usuario"},
        )

    assert exc.value.status_code == 400

def test_delete_sucursal_unauthorized(db_session):
    with pytest.raises(HTTPException) as exc:
        maps_service.delete_sucursal(db_session, 1, 1, None)

    assert exc.value.status_code == 401

def test_delete_correctivo_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        maps_service.delete_correctivo(db_session, 1, 1, {"type": "usuario"})

    assert exc.value.status_code == 404

def test_delete_preventivo_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        maps_service.delete_preventivo(db_session, 1, 1, {"type": "usuario"})

    assert exc.value.status_code == 404

def test_delete_selection_unauthorized(db_session):
    with pytest.raises(HTTPException) as exc:
        maps_service.delete_selection(db_session, 1, None)

    assert exc.value.status_code == 401
