import pytest
from src.services import zonas as zonas_service
from fastapi import HTTPException

def test_create_zona(db_session):
    zona = zonas_service.create_zona(db_session, nombre="Zona Test", current_entity={"type": "usuario"})
    assert zona.id is not None
    assert zona.nombre == "Zona Test"

def test_create_zona_already_exists(db_session):
    zonas_service.create_zona(db_session, nombre="Zona Duplicada", current_entity={"type": "usuario"})
    with pytest.raises(HTTPException) as exc:
        zonas_service.create_zona(db_session, nombre="Zona Duplicada", current_entity={"type": "usuario"})
    assert exc.value.status_code == 400
    assert "ya existe" in exc.value.detail

def test_get_zonas(db_session):
    zonas_service.create_zona(db_session, nombre="Zona 1", current_entity={"type": "usuario"})
    zonas_service.create_zona(db_session, nombre="Zona 2", current_entity={"type": "usuario"})
    zonas = zonas_service.get_zonas(db_session)
    assert len(zonas) == 2

def test_delete_zona(db_session):
    nueva_zona = zonas_service.create_zona(db_session, nombre="Zona para borrar", current_entity={"type": "usuario"})
    response = zonas_service.delete_zona(db_session, nueva_zona.id, current_entity={"type": "usuario"})
    assert response["message"] == "Zona eliminada"

    # Verificar que no existe más
    with pytest.raises(HTTPException) as exc:
        zonas_service.delete_zona(db_session, nueva_zona.id, current_entity={"type": "usuario"})
    assert exc.value.status_code == 404

def test_delete_zona_in_use(db_session, mocker):
    # Crear una zona
    nueva_zona = zonas_service.create_zona(db_session, nombre="Zona en uso", current_entity={"type": "usuario"})
    
    # Mockear para simular que la zona está en uso
    mocker.patch("sqlalchemy.orm.Query.count", return_value=1)
    
    with pytest.raises(HTTPException) as exc:
        zonas_service.delete_zona(db_session, nueva_zona.id, current_entity={"type": "usuario"})
    assert exc.value.status_code == 400
    assert "está en uso" in exc.value.detail