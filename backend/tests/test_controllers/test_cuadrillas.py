from unittest.mock import patch, MagicMock

def test_list_cuadrillas(client):
    cua = MagicMock(id=1, nombre="Cua", zona="Z", email="c@x.com")
    with patch("controllers.cuadrillas.get_cuadrillas", return_value=[cua]):
        resp = client.get("/cuadrillas/")
    assert resp.status_code == 200
    assert resp.json()[0] == {"id": 1, "nombre": "Cua", "zona": "Z", "email": "c@x.com"}

def test_get_cuadrilla(client):
    cua = MagicMock(id=1, nombre="Cua", zona="Z", email="c@x.com")
    with patch("controllers.cuadrillas.get_cuadrilla", return_value=cua):
        resp = client.get("/cuadrillas/1")
    assert resp.status_code == 200
    assert resp.json() == {"id": 1, "nombre": "Cua", "zona": "Z", "email": "c@x.com"}
