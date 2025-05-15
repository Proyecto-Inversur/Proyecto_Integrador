import pytest
from fastapi.testclient import TestClient
from src.api.routes import app

client = TestClient(app)

app.dependency_overrides = {}

def test_create_sucursal():
    """Test creating a sucursal"""
    response = client.post("/sucursales/", json={
        "nombre": "Sucursal Controller",
        "zona": "Zona Controller",
        "direccion": "Dirección Controller",
        "superficie": "80m2"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "Sucursal Controller"
    assert data["zona"] == "Zona Controller"
    assert data["direccion"] == "Dirección Controller"
    assert data["superficie"] == "80m2"
    assert "id" in data

def test_listar_sucursales():
    """Test listing all sucursales"""
    # Primero creamos
    client.post("/sucursales/", json={
        "nombre": "Sucursal para GET",
        "zona": "Zona GET",
        "direccion": "Dirección GET",
        "superficie": "85m2"
    })
    
    response = client.get("/sucursales/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_get_sucursal():
    """Test retrieving a single sucursal by ID"""
    # Primero creamos
    post_response = client.post("/sucursales/", json={
        "nombre": "Sucursal para GET",
        "zona": "Zona GET",
        "direccion": "Dirección GET",
        "superficie": "85m2"
    })
    sucursal_id = post_response.json()["id"]

    # Luego la pedimos
    get_response = client.get(f"/sucursales/{sucursal_id}")
    assert get_response.status_code == 200
    assert get_response.json()["id"] == sucursal_id

def test_update_sucursal():
    """Test updating a sucursal"""
    # Crear
    post_response = client.post("/sucursales/", json={
        "nombre": "Sucursal para UPDATE",
        "zona": "Zona",
        "direccion": "Dirección",
        "superficie": "90m2"
    })
    sucursal_id = post_response.json()["id"]

    # Actualizar
    put_response = client.put(f"/sucursales/{sucursal_id}", json={
        "nombre": "Sucursal Actualizada",
        "zona": "Zona Actualizada",
        "direccion": "Dirección Actualizada",
        "superficie": "95m2"
    })
    assert put_response.status_code == 200
    assert put_response.json()["nombre"] == "Sucursal Actualizada"

def test_delete_sucursal():
    """Test deleting a sucursal"""
    # Crear
    post_response = client.post("/sucursales/", json={
        "nombre": "Sucursal para DELETE",
        "zona": "Zona",
        "direccion": "Dirección",
        "superficie": "100m2"
    })
    sucursal_id = post_response.json()["id"]

    # Eliminar
    delete_response = client.delete(f"/sucursales/{sucursal_id}")
    assert delete_response.status_code == 200
    assert "eliminada" in delete_response.json()["message"]
