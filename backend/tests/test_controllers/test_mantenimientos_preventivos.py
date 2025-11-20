from unittest.mock import AsyncMock, MagicMock, patch


def _preventivo_mock():
    return MagicMock(
        id=1,
        cliente_id=10,
        sucursal_id=1,
        frecuencia="Mensual",
        id_cuadrilla=1,
        fecha_apertura="2025-01-01",
        fecha_cierre=None,
        planillas=[MagicMock(url="https://example.com/planilla.pdf")],
        fotos=[MagicMock(url="https://example.com/foto.jpg")],
        extendido=None,
        estado="Pendiente",
    )


def test_list_mantenimientos_preventivos(client):
    m = _preventivo_mock()
    with patch("controllers.mantenimientos_preventivos.get_mantenimientos_preventivos", return_value=[m]):
        resp = client.get("/mantenimientos-preventivos/")
    assert resp.status_code == 200
    assert resp.json()[0]["planillas"] == ["https://example.com/planilla.pdf"]


def test_get_mantenimiento_preventivo(client):
    m = _preventivo_mock()
    with patch("controllers.mantenimientos_preventivos.get_mantenimiento_preventivo", return_value=m):
        resp = client.get("/mantenimientos-preventivos/1")
    assert resp.status_code == 200
    assert resp.json()["fotos"] == ["https://example.com/foto.jpg"]


def test_create_mantenimiento_preventivo_passes_enum_value(client):
    m = _preventivo_mock()
    with patch(
        "controllers.mantenimientos_preventivos.create_mantenimiento_preventivo",
        AsyncMock(return_value=m),
    ) as mock_create:
        payload = {
            "cliente_id": 10,
            "sucursal_id": 1,
            "frecuencia": "Mensual",
            "id_cuadrilla": 1,
            "fecha_apertura": "2025-01-01",
            "estado": "Pendiente",
        }
        resp = client.post("/mantenimientos-preventivos/", json=payload)
    assert resp.status_code == 200
    args, _ = mock_create.await_args
    assert args[1:4] == (10, 1, "Mensual")


def test_update_mantenimiento_preventivo_returns_serialized_data(client):
    m = _preventivo_mock()
    m.fecha_cierre = "2025-02-01"
    with patch(
        "controllers.mantenimientos_preventivos.update_mantenimiento_preventivo",
        AsyncMock(return_value=m),
    ):
        payload = {
            "cliente_id": 10,
            "sucursal_id": 1,
            "frecuencia": "Mensual",
            "id_cuadrilla": 1,
            "fecha_apertura": "2025-01-01",
            "fecha_cierre": "2025-02-01",
            "estado": "En Progreso",
        }
        resp = client.put("/mantenimientos-preventivos/1", data=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert data["estado"] == "Pendiente"
    assert data["fecha_cierre"] == "2025-02-01"


def test_mantenimiento_preventivo_delete(client):
    result = {"message": "Mantenimiento preventivo con id 1 eliminado"}
    with patch(
        "controllers.mantenimientos_preventivos.delete_mantenimiento_preventivo",
        return_value=result,
    ) as mock_delete:
        resp = client.delete("/mantenimientos-preventivos/1")
    assert resp.status_code == 200
    assert resp.json() == result
    mock_delete.assert_called_once()


def test_mantenimiento_planilla_delete(client):
    with patch(
        "controllers.mantenimientos_preventivos.delete_mantenimiento_planilla",
        return_value=True,
    ) as mock_delete:
        resp = client.delete("/mantenimientos-preventivos/1/planillas/planilla.png")
    assert resp.status_code == 200
    assert resp.json() == {"message": "Planilla eliminada correctamente"}
    mock_delete.assert_called_once()


def test_mantenimiento_photo_delete(client):
    with patch(
        "controllers.mantenimientos_preventivos.delete_mantenimiento_photo",
        return_value=True,
    ) as mock_delete:
        resp = client.delete("/mantenimientos-preventivos/1/fotos/foto.jpg")
    assert resp.status_code == 200
    assert resp.json() == {"message": "Foto eliminada correctamente"}
    mock_delete.assert_called_once()
