from unittest.mock import patch, MagicMock, AsyncMock

def test_list_mantenimientos_preventivos(client):
    m = MagicMock(
        id=1,
        id_sucursal=1,
        frecuencia="Mensual",
        id_cuadrilla=1,
        fecha_apertura="2025-01-01",
        fecha_cierre=None,
        planillas=[],
        fotos=[],
        extendido=None,
        estado="Pendiente",
    )
    with patch("controllers.mantenimientos_preventivos.get_mantenimientos_preventivos", return_value=[m]):
        resp = client.get("/mantenimientos-preventivos/")
    assert resp.status_code == 200
    assert resp.json()[0] == {
        "id": 1,
        "id_sucursal": 1,
        "frecuencia": "Mensual",
        "id_cuadrilla": 1,
        "fecha_apertura": "2025-01-01",
        "fecha_cierre": None,
        "planillas": [],
        "fotos": [],
        "extendido": None,
        "estado": "Pendiente"
    }

def test_get_mantenimiento_preventivo(client):
    m = MagicMock(
        id=1,
        id_sucursal=1,
        frecuencia="Mensual",
        id_cuadrilla=1,
        fecha_apertura="2025-01-01",
        fecha_cierre="2025-02-01",
        planillas=[],
        fotos=[],
        extendido=None,
        estado="Pendiente",
    )
    with patch("controllers.mantenimientos_preventivos.get_mantenimiento_preventivo", return_value=m):
        resp = client.get("/mantenimientos-preventivos/1")
    assert resp.status_code == 200
    assert resp.json() == {
        "id": 1,
        "id_sucursal": 1,
        "frecuencia": "Mensual",
        "id_cuadrilla": 1,
        "fecha_apertura": "2025-01-01",
        "fecha_cierre": "2025-02-01",
        "planillas": [],
        "fotos": [],
        "extendido": None,
        "estado": "Pendiente"
    }

def test_create_mantenimiento_preventivo(client):
    m = MagicMock(id=1, id_sucursal=1, frecuencia="Mensual", id_cuadrilla=1, fecha_apertura="2025-01-01", estado="Pendiente")
    with patch("controllers.mantenimientos_preventivos.create_mantenimiento_preventivo", AsyncMock(return_value=m)):
        payload = {"id_sucursal": 1, "frecuencia": "Mensual", "id_cuadrilla": 1, "fecha_apertura": "2025-01-01", "estado": "Pendiente"}
        resp = client.post("/mantenimientos-preventivos/", json=payload)
    assert resp.status_code == 200
    assert resp.json() == {
        "id": 1,
        "id_sucursal": 1,
        "frecuencia": "Mensual",
        "id_cuadrilla": 1,
        "fecha_apertura": "2025-01-01",
        "estado": "Pendiente"
    }

def test_update_mantenimiento_preventivo(client):
    m = MagicMock(
        id=1,
        id_sucursal=1,
        frecuencia="Mensual",
        id_cuadrilla=1,
        fecha_apertura="2025-01-01",
        fecha_cierre="2025-02-01",
        planillas=[],
        fotos=[],
        extendido=None,
        estado="Pendiente",
    )
    with patch("controllers.mantenimientos_preventivos.update_mantenimiento_preventivo", AsyncMock(return_value=m)):
        payload = {
            "id_sucursal": 1,
            "frecuencia": "Mensual",
            "id_cuadrilla": 1,
            "fecha_apertura": "2025-01-01",
            "fecha_cierre": "2025-02-01",
            "estado": "Pendiente"
        }
        resp = client.put("/mantenimientos-preventivos/1", data=payload)
    assert resp.status_code == 200
    assert resp.json() == {
        "id": 1,
        "id_sucursal": 1,
        "frecuencia": "Mensual",
        "id_cuadrilla": 1,
        "fecha_apertura": "2025-01-01",
        "fecha_cierre": "2025-02-01",
        "planillas": [],
        "fotos": [],
        "extendido": None,
        "estado": "Pendiente"
    }

def test_mantenimiento_preventivo_delete(client):
    mock_result = {"message": "Mantenimiento preventivo con id 1 eliminado"}

    with patch(
        "controllers.mantenimientos_preventivos.delete_mantenimiento_preventivo",
        return_value=mock_result
    ):
        resp = client.delete("/mantenimientos-preventivos/1")
    assert resp.status_code == 200
    assert resp.json() == mock_result

def test_mantenimiento_planilla_delete(client):
    with patch(
        "controllers.mantenimientos_preventivos.delete_mantenimiento_planilla",
        return_value=True
    ):
        resp = client.delete("/mantenimientos-preventivos/1/planillas/planilla.png")
    assert resp.status_code == 200
    assert resp.json() == {"message": "Planilla eliminada correctamente"}

def test_mantenimiento_photo_delete(client):
    with patch(
        "controllers.mantenimientos_preventivos.delete_mantenimiento_photo",
        return_value=True
    ):
        resp = client.delete("/mantenimientos-preventivos/1/fotos/foto.jpg")
    assert resp.status_code == 200
    assert resp.json() == {"message": "Foto eliminada correctamente"}
