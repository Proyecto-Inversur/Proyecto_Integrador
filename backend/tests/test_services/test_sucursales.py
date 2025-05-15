import pytest
from src.services import sucursales as sucursales_service

def test_create_sucursal(db_session):
    sucursal = sucursales_service.create_sucursal(
        db=db_session,
        nombre="Sucursal Test",
        zona="Zona Norte",
        direccion="Av. Test 123",
        superficie="100m2",
        current_entity={"type": "usuario"}
    )
    assert sucursal.id is not None
    assert sucursal.nombre == "Sucursal Test"
    assert sucursal.zona == "Zona Norte"
    assert sucursal.direccion == "Av. Test 123"
    assert sucursal.superficie == "100m2"

def test_get_sucursales(db_session):
    # Crear dos sucursales
    sucursales_service.create_sucursal(db_session, "Sucursal 1", "Zona 1", "Dirección 1", "50m2", current_entity={"type": "usuario"})
    sucursales_service.create_sucursal(db_session, "Sucursal 2", "Zona 2", "Dirección 2", "70m2", current_entity={"type": "usuario"})

    sucursales = sucursales_service.get_sucursales(db_session)
    assert len(sucursales) == 2

def test_get_sucursal(db_session):
    nueva_sucursal = sucursales_service.create_sucursal(db_session, "Sucursal Única", "Zona Única", "Dirección Única", "150m2", current_entity={"type": "usuario"})
    sucursal = sucursales_service.get_sucursal(db_session, nueva_sucursal.id)
    assert sucursal.nombre == "Sucursal Única"

def test_update_sucursal(db_session):
    nueva_sucursal = sucursales_service.create_sucursal(db_session, "Sucursal vieja", "Zona vieja", "Dirección vieja", "90m2", current_entity={"type": "usuario"})
    actualizada = sucursales_service.update_sucursal(
        db_session, 
        nueva_sucursal.id, 
        nombre="Sucursal actualizada",
        zona="Zona actualizada",
        direccion="Dirección actualizada",
        superficie="95m2",
        current_entity={"type": "usuario"}
    )
    assert actualizada.nombre == "Sucursal actualizada"
    assert actualizada.zona == "Zona actualizada"

def test_delete_sucursal(db_session):
    nueva_sucursal = sucursales_service.create_sucursal(db_session, "Sucursal para borrar", "Zona X", "Dirección X", "60m2", current_entity={"type": "usuario"})
    response = sucursales_service.delete_sucursal(db_session, nueva_sucursal.id, current_entity={"type": "usuario"})
    assert response["message"] == f"Sucursal con id {nueva_sucursal.id} eliminada"

    # Verificar que no existe más
    with pytest.raises(Exception):
        sucursales_service.get_sucursal(db_session, nueva_sucursal.id)
