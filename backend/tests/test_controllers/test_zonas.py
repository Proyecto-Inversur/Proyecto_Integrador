import pytest
from fastapi.testclient import TestClient
from src.api.routes import app

client = TestClient(app)

app.dependency_overrides = {}
created_zona_id = None

def test_create_zona():
    """Test creating a zona"""
    response = client.post("/zonas/", json={
        "nombre": "Zona Test"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["nombre"] == "Zona Test"
    assert "id" in data

def test_create_zona_already_exists():
    """Test creating a zona that already exist"""
    # Primero creamos
    client.post("/zonas/", json={
        "nombre": "Zona Existente"
    })
    response = client.post("/zonas/", json={
        "nombre": "Zona Existente"
    })
    assert response.status_code == 400
    assert "ya existe" in response.json()["detail"]

def test_listar_zonas():
    """Test listing all zonas"""
    # Primero creamos
    client.post("/zonas/", json={
        "nombre": "Get Zona Test"
    })
    response = client.get("/zonas/")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1

def test_delete_zona():
    """Test deleting a zona"""
    # Primero creamos
    response = client.post("/zonas/", json={
        "nombre": "Delete Zona"
    })
    zona_id = response.json()["id"]
    delete_response = client.delete(f"/zonas/{zona_id}")
    assert delete_response.status_code == 200
    assert "eliminada" in delete_response.json()["message"]