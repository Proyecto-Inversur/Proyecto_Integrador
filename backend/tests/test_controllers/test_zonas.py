from unittest.mock import patch, MagicMock

def test_zonas_get(client):
    z = MagicMock(id=1, nombre="N")
    with patch("controllers.zonas.get_zonas", return_value=[z]):
        resp = client.get("/zonas/")
    assert resp.status_code == 200
    assert resp.json()[0] == {"id": 1, "nombre": "N"}

def test_zona_create(client):
    z = MagicMock(id=1, nombre="N")
    with patch("controllers.zonas.create_zona", return_value=z):
        payload = {"nombre": "N"}
        resp = client.post("/zonas/", json=payload)
    assert resp.status_code == 200
    assert resp.json() == {"id": 1, "nombre": "N"}

def test_zona_delete(client):
    mock_result = {"message": "Zona eliminada"}
    with patch("controllers.zonas.delete_zona", return_value=mock_result):
        resp = client.delete("/zonas/1")
    assert resp.status_code == 200
    assert resp.json() == mock_result
