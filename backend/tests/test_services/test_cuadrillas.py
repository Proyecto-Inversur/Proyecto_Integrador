import pytest
from src.services import cuadrillas as cuadrillas_service
from src.api.models import Cuadrilla
from fastapi import HTTPException

def test_get_cuadrillas(db_session):
    """Test retrieving all cuadrillas"""
    # Create two cuadrillas
    db_session.add(Cuadrilla(nombre="Cuadrilla 1", zona="Zona 1", email="c1@test.com"))
    db_session.add(Cuadrilla(nombre="Cuadrilla 2", zona="Zona 2", email="c2@test.com"))
    db_session.commit()

    cuadrillas = cuadrillas_service.get_cuadrillas(db_session)
    assert len(cuadrillas) == 2
    assert any(c.nombre == "Cuadrilla 1" for c in cuadrillas)
    assert any(c.nombre == "Cuadrilla 2" for c in cuadrillas)

def test_get_cuadrilla(db_session):
    """Test retrieving a single cuadrilla by ID"""
    db_cuadrilla = Cuadrilla(nombre="Cuadrilla Test", zona="Zona Test", email="test@test.com")
    db_session.add(db_cuadrilla)
    db_session.commit()
    cuadrilla_id = db_cuadrilla.id

    cuadrilla = cuadrillas_service.get_cuadrilla(db_session, cuadrilla_id)
    assert cuadrilla.id == cuadrilla_id
    assert cuadrilla.nombre == "Cuadrilla Test"
    assert cuadrilla.zona == "Zona Test"
    assert cuadrilla.email == "test@test.com"

def test_get_cuadrilla_not_found(db_session):
    """Test retrieving a non-existent cuadrilla"""
    with pytest.raises(HTTPException) as exc:
        cuadrillas_service.get_cuadrilla(db_session, 9999)
    assert exc.value.status_code == 404
    assert "no encontrada" in exc.value.detail