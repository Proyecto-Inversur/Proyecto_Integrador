from types import SimpleNamespace
from unittest.mock import patch, AsyncMock

def test_sucursales_locations(client):
    s = SimpleNamespace(id="1", name="S", lat=1.0, lng=2.0)
    with patch("controllers.maps.get_sucursales_locations", return_value=[s]):
        resp = client.get("/maps/sucursales-locations")
    assert resp.status_code == 200
    assert resp.json() == [{"id": "1", "name": "S", "lat": 1.0, "lng": 2.0}]

def test_users_locations(client):
    c = SimpleNamespace(id="1", tipo="C", name="C", lat=1.0, lng=2.0)
    with patch("controllers.maps.get_users_locations", return_value=[c]):
        resp = client.get("/maps/users-locations")
    assert resp.status_code == 200
    assert resp.json() == [{"id": "1", "tipo": "C", "name": "C", "lat": 1.0, "lng": 2.0}]

def test_correctivos_selection(client):
    c = SimpleNamespace(id_mantenimiento="1", id_sucursal="1")
    with patch("controllers.maps.get_correctivos", return_value=[c]):
        resp = client.get("/maps/correctivo-selection/1")
    assert resp.status_code == 200
    assert resp.json() == [{"id_mantenimiento": "1", "id_sucursal": "1"}]

def test_preventivos_selection(client):
    p = SimpleNamespace(id_mantenimiento="1", id_sucursal="1")
    with patch("controllers.maps.get_preventivos", return_value=[p]):
        resp = client.get("/maps/preventivo-selection/1")
    assert resp.status_code == 200
    assert resp.json() == [{"id_mantenimiento": "1", "id_sucursal": "1"}]

def test_update_user_location(client):
    payload = {
        "name": "N", 
        "lat": 1.0, 
        "lng": 2.0
    }
    with patch("controllers.maps.update_user_location", AsyncMock(return_value={"message": "Ubicación actualizada para 1"})):
        resp = client.post("/maps/update-user-location", json=payload)
    assert resp.status_code == 200
    assert resp.json() == {"message": "Ubicación actualizada para 1"}

def test_select_correctivo(client):
    c = SimpleNamespace(id="1", id_cuadrilla="1", id_mantenimiento="1", id_sucursal="1")
    payload = {
        "id_mantenimiento": 1, 
        "id_sucursal": 1
    }
    with patch("controllers.maps.update_correctivo", return_value=c):
        resp = client.post("/maps/select-correctivo", json=payload)
    assert resp.status_code == 200
    assert resp.json() == {"id": "1", "id_cuadrilla": "1", "id_mantenimiento": "1", "id_sucursal": "1"}

def test_select_preventivo(client):
    c = SimpleNamespace(id="1", id_cuadrilla="1", id_mantenimiento="1", id_sucursal="1")
    payload = {
        "id_mantenimiento": 1, 
        "id_sucursal": 1
    }
    with patch("controllers.maps.update_preventivo", return_value=c):
        resp = client.post("/maps/select-preventivo", json=payload)
    assert resp.status_code == 200
    assert resp.json() == {"id": "1", "id_cuadrilla": "1", "id_mantenimiento": "1", "id_sucursal": "1"}

def test_sucursal_delete(client):
    mock_result = {"message": "Seleccion de sucursal eliminada"}
    with patch("controllers.maps.delete_sucursal", return_value=mock_result):
        resp = client.delete("/maps/sucursal/1")
    assert resp.status_code == 200
    assert resp.json() == mock_result

def test_correctivo_delete(client):
    mock_result = {"message": "Seleccion de correctivo eliminada"}
    with patch("controllers.maps.delete_correctivo", return_value=mock_result):
        resp = client.delete("/maps/correctivo/1")
    assert resp.status_code == 200
    assert resp.json() == mock_result

def test_preventivo_delete(client):
    mock_result = {"message": "Seleccion de preventivo eliminada"}
    with patch("controllers.maps.delete_preventivo", return_value=mock_result):
        resp = client.delete("/maps/preventivo/1")
    assert resp.status_code == 200
    assert resp.json() == mock_result

def test_selection_delete(client):
    mock_result = {"message": "Seleccion eliminada"}
    with patch("controllers.maps.delete_preventivo", return_value=mock_result):
        resp = client.delete("/maps/selection")
    assert resp.status_code == 200
    assert resp.json() == mock_result
