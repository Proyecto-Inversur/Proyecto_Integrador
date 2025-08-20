from unittest.mock import patch, MagicMock

def test_preventivos_get(client):
    p = MagicMock(id=1, id_sucursal=1, nombre_sucursal="S", frecuencia="Mensual")
    with patch("controllers.preventivos.get_preventivos", return_value=[p]):
        resp = client.get("/preventivos/")
    assert resp.status_code == 200
    assert resp.json()[0] == {"id": 1, "id_sucursal": 1, "nombre_sucursal": "S", "frecuencia": "Mensual"}

def test_preventivo_get(client):
    p = MagicMock(id=1, id_sucursal=1, nombre_sucursal="S", frecuencia="Mensual")
    with patch("controllers.preventivos.get_preventivo", return_value=p):
        resp = client.get("/preventivos/1")
    assert resp.status_code == 200
    assert resp.json() == {"id": 1, "id_sucursal": 1, "nombre_sucursal": "S", "frecuencia": "Mensual"}

def test_preventivo_create(client):
    p = MagicMock(id=1, id_sucursal=1, nombre_sucursal="S", frecuencia="Mensual")
    with patch("controllers.preventivos.create_preventivo", return_value=p):
        payload = {"id_sucursal": 1, "nombre_sucursal": "S", "frecuencia": "Mensual"}
        resp = client.post("/preventivos/", json=payload)
    assert resp.status_code == 200
    assert resp.json() == {"id": 1, "id_sucursal": 1, "nombre_sucursal": "S", "frecuencia": "Mensual"}

def test_preventivo_update(client):
    p = MagicMock(id=1, id_sucursal=1, nombre_sucursal="S", frecuencia="Mensual")
    with patch("controllers.preventivos.update_preventivo", return_value=p):
        payload = {"id_sucursal": 1, "nombre_sucursal": "S", "frecuencia": "Mensual"}
        resp = client.put("/preventivos/1", json=payload)
    assert resp.status_code == 200
    assert resp.json() == {"id": 1, "id_sucursal": 1, "nombre_sucursal": "S", "frecuencia": "Mensual"}

def test_preventivo_delete(client):
    mock_result = {"message": "Preventivo con id 1 eliminado"}
    with patch("controllers.preventivos.delete_preventivo", return_value=mock_result):
        resp = client.delete("/preventivos/1")
    assert resp.status_code == 200
    assert resp.json() == mock_result
