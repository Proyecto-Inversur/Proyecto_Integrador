import pytest
from fastapi import HTTPException
from src.services import cuadrillas as cuadrillas_service
from src.api.models import Cuadrilla

def test_get_cuadrillas(db_session):
    cuadrilla = Cuadrilla(nombre="C1", zona="Norte", email="c1@example.com")
    db_session.add(cuadrilla)
    db_session.commit()
    db_session.refresh(cuadrilla)

    result = cuadrillas_service.get_cuadrillas(db_session)

    assert result[0].id == cuadrilla.id
    assert result[0].nombre == "C1"

def test_get_cuadrilla(db_session):
    cuadrilla = Cuadrilla(nombre="C1", zona="Norte", email="c1@example.com")
    db_session.add(cuadrilla)
    db_session.commit()
    db_session.refresh(cuadrilla)

    result = cuadrillas_service.get_cuadrilla(db_session, cuadrilla.id)

    assert result.id == cuadrilla.id
    assert result.nombre == "C1"

def test_get_cuadrillas_empty(db_session):
    result = cuadrillas_service.get_cuadrillas(db_session)
    assert result == []

def test_get_cuadrilla_not_found(db_session):
    with pytest.raises(HTTPException):
        cuadrillas_service.get_cuadrilla(db_session, 999)
