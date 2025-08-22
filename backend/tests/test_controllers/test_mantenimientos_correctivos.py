from unittest.mock import patch, MagicMock, AsyncMock

def test_list_mantenimientos_correctivos(client):
    m = MagicMock(
        id=1,
        id_sucursal=1,
        id_cuadrilla=1,
        fecha_apertura="2025-01-01",
        fecha_cierre=None,
        numero_caso="1",
        incidente="Incidente",
        rubro="Otros",
        planilla=None,
        fotos=[],
        estado="Pendiente",
        prioridad="Baja",
        extendido=None,
    )
    with patch("controllers.mantenimientos_correctivos.get_mantenimientos_correctivos", return_value=[m]):
        resp = client.get("/mantenimientos-correctivos/")
    assert resp.status_code == 200
    assert resp.json()[0] == {
        "id": 1,
        "id_sucursal": 1,
        "id_cuadrilla": 1,
        "fecha_apertura": "2025-01-01",
        "fecha_cierre": None,
        "numero_caso": "1",
        "incidente": "Incidente",
        "rubro": "Otros",
        "planilla": None,
        "fotos": [],
        "estado": "Pendiente",
        "prioridad": "Baja",
        "extendido": None
    }

def test_get_mantenimiento_correctivo(client):
    m = MagicMock(
        id=1,
        id_sucursal=1,
        id_cuadrilla=1,
        fecha_apertura="2025-01-01",
        fecha_cierre=None,
        numero_caso="1",
        incidente="Incidente",
        rubro="Otros",
        planilla=None,
        fotos=[],
        estado="Pendiente",
        prioridad="Baja",
        extendido=None,
    )
    with patch("controllers.mantenimientos_correctivos.get_mantenimiento_correctivo", return_value=m):
        resp = client.get("/mantenimientos-correctivos/1")
    assert resp.status_code == 200
    assert resp.json() == {
        "id": 1,
        "id_sucursal": 1,
        "id_cuadrilla": 1,
        "fecha_apertura": "2025-01-01",
        "fecha_cierre": None,
        "numero_caso": "1",
        "incidente": "Incidente",
        "rubro": "Otros",
        "planilla": None,
        "fotos": [],
        "estado": "Pendiente",
        "prioridad": "Baja",
        "extendido": None
    }

def test_create_mantenimiento_correctivo(client):
    m = MagicMock(
        id=1,
        id_sucursal=1,
        id_cuadrilla=1,
        fecha_apertura="2025-01-01",
        numero_caso="1",
        incidente="Incidente",
        rubro="Otros",
        estado="Pendiente",
        prioridad="Baja",
    )
    with patch("controllers.mantenimientos_correctivos.create_mantenimiento_correctivo", AsyncMock(return_value=m)):
        payload = {
            "id_sucursal": 1,
            "id_cuadrilla": 1,
            "fecha_apertura": "2025-01-01",
            "numero_caso": "1",
            "incidente": "Incidente",
            "rubro": "Otros",
            "estado": "Pendiente",
            "prioridad": "Baja",
        }
        resp = client.post("/mantenimientos-correctivos/", json=payload)
    assert resp.status_code == 200
    assert resp.json() == {
        "id": 1,
        "id_sucursal": 1,
        "id_cuadrilla": 1,
        "fecha_apertura": "2025-01-01",
        "numero_caso": "1",
        "incidente": "Incidente",
        "rubro": "Otros",
        "estado": "Pendiente",
        "prioridad": "Baja"
    }

def test_update_mantenimiento_correctivo(client):
    m = MagicMock(
        id=1,
        id_sucursal=1,
        id_cuadrilla=1,
        fecha_apertura="2025-01-01",
        fecha_cierre="2025-02-01",
        numero_caso="1",
        incidente="Incidente",
        rubro="Otros",
        planilla=None,
        fotos=[],
        estado="Pendiente",
        prioridad="Baja",
        extendido=None,
    )
    with patch("controllers.mantenimientos_correctivos.update_mantenimiento_correctivo", AsyncMock(return_value=m)):
        payload = {
            "id_sucursal": 1,
            "id_cuadrilla": 1,
            "fecha_apertura": "2025-01-01",
            "fecha_cierre": "2025-02-01",
            "numero_caso": "1",
            "incidente": "Incidente",
            "rubro": "Otros",
            "estado": "Pendiente",
            "prioridad": "Baja",
        }
        resp = client.put("/mantenimientos-correctivos/1", data=payload)
    assert resp.status_code == 200
    assert resp.json() == {
        "id": 1,
        "id_sucursal": 1,
        "id_cuadrilla": 1,
        "fecha_apertura": "2025-01-01",
        "fecha_cierre": "2025-02-01",
        "numero_caso": "1",
        "incidente": "Incidente",
        "rubro": "Otros",
        "planilla": None,
        "fotos": [],
        "estado": "Pendiente",
        "prioridad": "Baja",
        "extendido": None
    }

def test_mantenimiento_correctivo_delete(client):
    mock_result = {"message": "Mantenimiento correctivo con id 1 eliminado"}

    with patch(
        "controllers.mantenimientos_correctivos.delete_mantenimiento_correctivo",
        return_value=mock_result
    ):
        resp = client.delete("/mantenimientos-correctivos/1")
    assert resp.status_code == 200
    assert resp.json() == mock_result

def test_mantenimiento_planilla_delete(client):
    with patch(
        "controllers.mantenimientos_correctivos.delete_mantenimiento_planilla",
        return_value=True
    ):
        resp = client.delete("/mantenimientos-correctivos/1/planilla/planilla.png")
    assert resp.status_code == 200
    assert resp.json() == {"message": "Planilla eliminada correctamente"}

def test_mantenimiento_photo_delete(client):
    with patch(
        "controllers.mantenimientos_correctivos.delete_mantenimiento_photo",
        return_value=True
    ):
        resp = client.delete("/mantenimientos-correctivos/1/fotos/foto.jpg")
    assert resp.status_code == 200
    assert resp.json() == {"message": "Foto eliminada correctamente"}
