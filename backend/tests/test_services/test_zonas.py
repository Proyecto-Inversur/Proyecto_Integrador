import pytest
from fastapi import HTTPException
from src.services import zonas as zonas_service
from src.api.models import Cliente, Sucursal

def test_get_zonas(db_session):
    zonas_service.create_zona(
        db_session, nombre="Zona 1", current_entity={"type": "usuario"}
    )
    zonas_service.create_zona(
        db_session, nombre="Zona 2", current_entity={"type": "usuario"}
    )
    zonas = zonas_service.get_zonas(db_session)
    assert len(zonas) == 2

def test_create_zona(db_session):
    zona = zonas_service.create_zona(
        db_session, nombre="Zona Test", current_entity={"type": "usuario"}
    )
    assert zona.id is not None
    assert zona.nombre == "Zona Test"

def test_create_zona_already_exists(db_session):
    zonas_service.create_zona(
        db_session, nombre="Zona Duplicada", current_entity={"type": "usuario"}
    )
    with pytest.raises(HTTPException) as exc:
        zonas_service.create_zona(
            db_session, nombre="Zona Duplicada", current_entity={"type": "usuario"}
        )
    assert exc.value.status_code == 400
    assert "ya existe" in exc.value.detail

def test_delete_zona(db_session):
    nueva_zona = zonas_service.create_zona(
        db_session, nombre="Zona para borrar", current_entity={"type": "usuario"}
    )
    response = zonas_service.delete_zona(
        db_session, nueva_zona.id, current_entity={"type": "usuario"}
    )
    assert response["message"] == "Zona eliminada"

    with pytest.raises(HTTPException) as exc:
        zonas_service.delete_zona(
            db_session, nueva_zona.id, current_entity={"type": "usuario"}
        )
    assert exc.value.status_code == 404

def test_delete_zona_in_use(db_session):
    zona = zonas_service.create_zona(
        db_session, nombre="Zona en uso", current_entity={"type": "usuario"}
    )
    cliente = Cliente(nombre="ACME", contacto="Jane", email="acme@example.com")
    db_session.add(cliente)
    db_session.commit()

    db_session.add(
        Sucursal(nombre="S1", zona=zona.nombre, direccion="D", superficie="1", cliente_id=cliente.id)
    )
    db_session.commit()
    
    with pytest.raises(HTTPException) as exc:
        zonas_service.delete_zona(db_session, zona.id, current_entity={"type": "usuario"})
    assert exc.value.status_code == 400
    assert "está en uso" in exc.value.detail

def test_create_zona_without_auth(db_session):
    with pytest.raises(HTTPException) as exc:
        zonas_service.create_zona(db_session, nombre="Zona", current_entity=None)
    assert exc.value.status_code == 401

def test_create_zona_no_permissions(db_session):
    with pytest.raises(HTTPException) as exc:
        zonas_service.create_zona(
            db_session,
            nombre="Zona",
            current_entity={"type": "cuadrilla"},
        )
    assert exc.value.status_code == 403

def test_delete_zona_not_found(db_session):
    with pytest.raises(HTTPException) as exc:
        zonas_service.delete_zona(db_session, 999, current_entity={"type": "usuario"})
    assert exc.value.status_code == 404

def test_delete_zona_without_auth(db_session):
    zona = zonas_service.create_zona(
        db_session, nombre="Zona sin auth", current_entity={"type": "usuario"}
    )
    with pytest.raises(HTTPException) as exc:
        zonas_service.delete_zona(db_session, zona.id, current_entity=None)
    assert exc.value.status_code == 401

def test_delete_zona_no_permissions(db_session):
    zona = zonas_service.create_zona(
        db_session, nombre="Zona sin permisos", current_entity={"type": "usuario"}
    )
    with pytest.raises(HTTPException) as exc:
        zonas_service.delete_zona(db_session, zona.id, current_entity={"type": "cuadrilla"})
    assert exc.value.status_code == 403
