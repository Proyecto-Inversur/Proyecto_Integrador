from datetime import date
from unittest.mock import AsyncMock, MagicMock, patch


def _correctivo_mock():
    return MagicMock(
        id=1,
        cliente_id=10,
        sucursal_id=1,
        id_cuadrilla=1,
        fecha_apertura="2025-01-01",
        fecha_cierre=None,
        numero_caso="1",
        incidente="Incidente",
        rubro="Otros",
        planilla=None,
        fotos=[MagicMock(url="https://example.com/foto-1.jpg")],
        estado="Pendiente",
        prioridad="Baja",
        extendido=None,
    )


def test_list_mantenimientos_correctivos(client):
    m = _correctivo_mock()
    with patch("controllers.mantenimientos_correctivos.get_mantenimientos_correctivos", return_value=[m]):
        resp = client.get("/mantenimientos-correctivos/")
    assert resp.status_code == 200
    assert resp.json()[0]["fotos"] == ["https://example.com/foto-1.jpg"]


def test_get_mantenimiento_correctivo(client):
    m = _correctivo_mock()
    with patch("controllers.mantenimientos_correctivos.get_mantenimiento_correctivo", return_value=m):
        resp = client.get("/mantenimientos-correctivos/1")
    assert resp.status_code == 200
    assert resp.json()["numero_caso"] == "1"


def test_create_mantenimiento_correctivo_uses_current_entity(client):
    m = _correctivo_mock()
    entity = {"type": "usuario"}
    with patch(
        "controllers.mantenimientos_correctivos.create_mantenimiento_correctivo",
        AsyncMock(return_value=m),
    ) as mock_create:
        client.app.state.current_entity = entity
        payload = {
            "cliente_id": 10,
            "sucursal_id": 1,
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
    assert resp.json()["incidente"] == "Incidente"
    args, _ = mock_create.await_args
    assert args[1:6] == (10, 1, 1, date(2025, 1, 1), "1")
    assert args[-1] == entity


def test_update_mantenimiento_correctivo_returns_serialized_data(client):
    m = _correctivo_mock()
    m.fecha_cierre = "2025-02-01"
    with patch(
        "controllers.mantenimientos_correctivos.update_mantenimiento_correctivo",
        AsyncMock(return_value=m),
    ):
        payload = {
            "cliente_id": 10,
            "sucursal_id": 1,
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
    data = resp.json()
    assert data["fotos"] == ["https://example.com/foto-1.jpg"]
    assert data["fecha_cierre"] == "2025-02-01"


def test_mantenimiento_correctivo_delete(client):
    result = {"message": "Mantenimiento correctivo con id 1 eliminado"}
    with patch(
        "controllers.mantenimientos_correctivos.delete_mantenimiento_correctivo",
        return_value=result,
    ) as mock_delete:
        resp = client.delete("/mantenimientos-correctivos/1")
    assert resp.status_code == 200
    assert resp.json() == result
    mock_delete.assert_called_once()


def test_mantenimiento_planilla_delete_uses_service(client):
    with patch(
        "controllers.mantenimientos_correctivos.delete_mantenimiento_planilla",
        return_value=True,
    ) as mock_delete:
        resp = client.delete("/mantenimientos-correctivos/1/planilla/planilla.png")
    assert resp.status_code == 200
    assert resp.json() == {"message": "Planilla eliminada correctamente"}
    mock_delete.assert_called_once()


def test_mantenimiento_photo_delete_uses_service(client):
    with patch(
        "controllers.mantenimientos_correctivos.delete_mantenimiento_photo",
        return_value=True,
    ) as mock_delete:
        resp = client.delete("/mantenimientos-correctivos/1/fotos/foto.jpg")
    assert resp.status_code == 200
    assert resp.json() == {"message": "Foto eliminada correctamente"}
    mock_delete.assert_called_once()
