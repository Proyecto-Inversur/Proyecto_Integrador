from unittest.mock import patch, MagicMock

def test_sucursales_get(client):
    s = MagicMock(id=1, nombre="N", zona="Z", direccion="D", superficie="1")
    with patch("controllers.sucursales.get_sucursales", return_value=[s]):
        resp = client.get("/sucursales/")
    assert resp.status_code == 200
    assert resp.json()[0] == {"id": 1, "nombre": "N", "zona": "Z", "direccion": "D", "superficie": "1"}

def test_sucursal_get(client):
    s = MagicMock(id=1, nombre="N", zona="Z", direccion="D", superficie="1")
    with patch("controllers.sucursales.get_sucursal", return_value=s):
        resp = client.get("/sucursales/1")
    assert resp.status_code == 200
    assert resp.json() == {"id": 1, "nombre": "N", "zona": "Z", "direccion": "D", "superficie": "1"}

def test_sucursal_create(client):
    s = MagicMock(id=1, nombre="N", zona="Z", direccion="D", superficie="1")
    with patch("controllers.sucursales.create_sucursal", return_value=s):
        payload = {
            "nombre": "N", 
            "zona": "Z", 
            "direccion": {
                "address": "A", 
                "lat": 1.0, 
                "lng": 1.0
            }, 
            "superficie": "1"
        }
        resp = client.post("/sucursales/", json=payload)
    assert resp.status_code == 200
    assert resp.json() == {"id": 1, "nombre": "N", "zona": "Z", "direccion": "D", "superficie": "1"}

def test_sucursal_update(client):
    s = MagicMock(id=1, nombre="N", zona="Z", direccion="D", superficie="1")
    with patch("controllers.sucursales.update_sucursal", return_value=s):
        payload = {
            "nombre": "N", 
            "zona": "Z", 
            "direccion": {
                "address": "A", 
                "lat": 1.0, 
                "lng": 1.0
            }, 
            "superficie": "1"
        }
        resp = client.put("/sucursales/1", json=payload)
    assert resp.status_code == 200
    assert resp.json() == {"id": 1, "nombre": "N", "zona": "Z", "direccion": "D", "superficie": "1"}

def test_sucursal_delete(client):
    mock_result = {"message": "Sucursal con id 1 eliminada"}
    with patch("controllers.sucursales.delete_sucursal", return_value=mock_result):
        resp = client.delete("/sucursales/1")
    assert resp.status_code == 200
    assert resp.json() == mock_result
