import pytest
from fastapi import HTTPException
from src.services import preventivos as preventivos_service
from src.api.models import Sucursal, Preventivo

def test_get_preventivos(db_session):
    sucursal = Sucursal(nombre="Sucursal1", zona="Zona1", direccion="Dir1", superficie="100")
    db_session.add(sucursal)
    db_session.commit()
    preventivos_service.create_preventivo(db_session, sucursal.id, "Sucursal1", "mensual", {"type": "usuario"})
    result = preventivos_service.get_preventivos(db_session)
    assert len(result) == 1

def test_get_preventivo(db_session):
    sucursal = Sucursal(nombre="Sucursal2", zona="Zona1", direccion="Dir1", superficie="100")
    db_session.add(sucursal)
    db_session.commit()
    created = preventivos_service.create_preventivo(db_session, sucursal.id, "Sucursal2", "mensual", {"type": "usuario"})
    result = preventivos_service.get_preventivo(db_session, created.id)
    assert result.id == created.id

def test_create_preventivo(db_session):
    sucursal = Sucursal(nombre="Sucursal3", zona="Zona1", direccion="Dir1", superficie="100")
    db_session.add(sucursal)
    db_session.commit()
    created = preventivos_service.create_preventivo(db_session, sucursal.id, "Sucursal3", "mensual", {"type": "usuario"})
    assert created.id is not None
    assert created.frecuencia == "mensual"

def test_update_preventivo(db_session):
    sucursal = Sucursal(nombre="Sucursal4", zona="Zona1", direccion="Dir1", superficie="100")
    db_session.add(sucursal)
    db_session.commit()
    created = preventivos_service.create_preventivo(db_session, sucursal.id, "Sucursal4", "mensual", {"type": "usuario"})
    updated = preventivos_service.update_preventivo(db_session, created.id, {"type": "usuario"}, frecuencia="semanal")
    assert updated.frecuencia == "semanal"

def test_delete_preventivo(db_session):
    sucursal = Sucursal(nombre="Sucursal5", zona="Zona1", direccion="Dir1", superficie="100")
    db_session.add(sucursal)
    db_session.commit()
    created = preventivos_service.create_preventivo(db_session, sucursal.id, "Sucursal5", "mensual", {"type": "usuario"})
    response = preventivos_service.delete_preventivo(db_session, created.id, {"type": "usuario"})
    assert response == {"message": f"Preventivo con id {created.id} eliminado"}
    assert db_session.query(Preventivo).count() == 0

def test_get_preventivos_empty(db_session):
    result = preventivos_service.get_preventivos(db_session)
    assert result == []

def test_get_preventivo_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        preventivos_service.get_preventivo(db_session, 999)
    assert exc.value.status_code == 404

def test_create_preventivo_without_auth(db_session):
    sucursal = Sucursal(nombre="SucursalF", zona="Z", direccion="D", superficie="10")
    db_session.add(sucursal)
    db_session.commit()
    with pytest.raises(HTTPException) as exc:
        preventivos_service.create_preventivo(db_session, sucursal.id, "SucursalF", "m", None)
    assert exc.value.status_code == 401

def test_create_preventivo_forbidden_role(db_session):
    sucursal = Sucursal(nombre="SucursalF2", zona="Z", direccion="D", superficie="10")
    db_session.add(sucursal)
    db_session.commit()
    with pytest.raises(HTTPException) as exc:
        preventivos_service.create_preventivo(db_session, sucursal.id, "SucursalF2", "m", {"type": "otro"})
    assert exc.value.status_code == 403

def test_create_preventivo_existing(db_session):
    sucursal = Sucursal(nombre="SucursalE", zona="Z", direccion="D", superficie="10")
    db_session.add(sucursal)
    db_session.commit()
    preventivos_service.create_preventivo(db_session, sucursal.id, "SucursalE", "m", {"type": "usuario"})
    with pytest.raises(HTTPException) as exc:
        preventivos_service.create_preventivo(db_session, sucursal.id, "SucursalE", "m", {"type": "usuario"})
    assert exc.value.status_code == 400

def test_create_preventivo_sucursal_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        preventivos_service.create_preventivo(db_session, 999, "S", "m", {"type": "usuario"})
    assert exc.value.status_code == 404

def test_update_preventivo_without_auth(db_session):
    with pytest.raises(HTTPException) as exc:
        preventivos_service.update_preventivo(db_session, 1, None, frecuencia="s")
    assert exc.value.status_code == 401

def test_update_preventivo_forbidden_role(db_session):
    with pytest.raises(HTTPException) as exc:
        preventivos_service.update_preventivo(db_session, 1, {"type": "otro"}, frecuencia="s")
    assert exc.value.status_code == 403

def test_update_preventivo_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        preventivos_service.update_preventivo(db_session, 999, {"type": "usuario"}, frecuencia="s")
    assert exc.value.status_code == 404

def test_update_preventivo_sucursal_not_found(db_session):
    sucursal = Sucursal(nombre="SucursalU", zona="Z", direccion="D", superficie="10")
    db_session.add(sucursal)
    db_session.commit()
    created = preventivos_service.create_preventivo(db_session, sucursal.id, "SucursalU", "m", {"type": "usuario"})
    with pytest.raises(HTTPException) as exc:
        preventivos_service.update_preventivo(db_session, created.id, {"type": "usuario"}, id_sucursal=999, nombre_sucursal="X")
    assert exc.value.status_code == 404

def test_delete_preventivo_without_auth(db_session):
    with pytest.raises(HTTPException) as exc:
        preventivos_service.delete_preventivo(db_session, 1, None)
    assert exc.value.status_code == 401

def test_delete_preventivo_forbidden_role(db_session):
    with pytest.raises(HTTPException) as exc:
        preventivos_service.delete_preventivo(db_session, 1, {"type": "otro"})
    assert exc.value.status_code == 403

def test_delete_preventivo_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        preventivos_service.delete_preventivo(db_session, 999, {"type": "usuario"})
    assert exc.value.status_code == 404
