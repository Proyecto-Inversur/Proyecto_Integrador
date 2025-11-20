from unittest.mock import ANY, MagicMock, patch


def _sucursal_mock():
    return MagicMock(
        id=1,
        nombre="N",
        zona="Z",
        direccion="D",
        superficie="1",
        cliente_id=2,
        frecuencia_preventivo="Mensual",
    )


def test_sucursales_get_by_cliente(client):
    sucursal = _sucursal_mock()
    with patch("controllers.sucursales.get_sucursales_by_cliente", return_value=[sucursal]) as mock_service:
        resp = client.get("/clientes/2/sucursales")
    assert resp.status_code == 200
    assert resp.json()[0] == {
        "id": 1,
        "nombre": "N",
        "zona": "Z",
        "direccion": "D",
        "superficie": "1",
        "cliente_id": 2,
        "frecuencia_preventivo": "Mensual",
    }
    mock_service.assert_called_once_with(ANY, 2)


def test_sucursal_get(client):
    sucursal = _sucursal_mock()
    with patch("controllers.sucursales.get_sucursal", return_value=sucursal) as mock_service:
        resp = client.get("/sucursales/1")
    assert resp.status_code == 200
    assert resp.json()["nombre"] == "N"
    mock_service.assert_called_once_with(ANY, 1)


def test_sucursal_create_requires_matching_cliente(client):
    payload = {
        "nombre": "N",
        "zona": "Z",
        "direccion": {"address": "A", "lat": 1.0, "lng": 1.0},
        "superficie": "1",
        "cliente_id": 99,
        "frecuencia_preventivo": "Mensual",
    }
    resp = client.post("/clientes/2/sucursales", json=payload)
    assert resp.status_code == 400
    assert resp.json()["detail"] == "El cliente del cuerpo no coincide con el de la ruta"


def test_sucursal_create_passes_enum_value(client):
    sucursal = _sucursal_mock()
    entity = {"type": "usuario"}
    with patch("controllers.sucursales.create_sucursal", return_value=sucursal) as mock_service:
        client.app.state.current_entity = entity
        payload = {
            "nombre": "N",
            "zona": "Z",
            "direccion": {"address": "A", "lat": 1.0, "lng": 1.0},
            "superficie": "1",
            "cliente_id": 2,
            "frecuencia_preventivo": "Mensual",
        }
        resp = client.post("/clientes/2/sucursales", json=payload)
    assert resp.status_code == 200
    mock_service.assert_called_once()
    _, cliente_id, nombre, zona, direccion, superficie, frecuencia, current_entity = mock_service.call_args[0]
    assert cliente_id == 2
    assert (nombre, zona) == ("N", "Z")
    assert direccion == {"address": "A", "lat": 1.0, "lng": 1.0}
    assert superficie == "1"
    assert frecuencia == "Mensual"
    assert current_entity == entity


def test_sucursal_update_handles_frequency_flag(client):
    sucursal = _sucursal_mock()
    entity = {"type": "usuario"}
    with patch("controllers.sucursales.update_sucursal", return_value=sucursal) as mock_service:
        client.app.state.current_entity = entity
        payload = {
            "nombre": "Nuevo",
            "frecuencia_preventivo": "Trimestral",
        }
        resp = client.put("/sucursales/1", json=payload)
    assert resp.status_code == 200
    mock_service.assert_called_once()
    args = mock_service.call_args[0]
    assert args[1] == 1  # sucursal_id
    assert args[2] == entity
    assert args[3] == "Nuevo"
    assert args[7] == "Trimestral"
    assert args[8] is True  # frecuencia_provided


def test_sucursal_update_without_frequency_keeps_flag_false(client):
    sucursal = _sucursal_mock()
    with patch("controllers.sucursales.update_sucursal", return_value=sucursal) as mock_service:
        resp = client.put("/sucursales/1", json={"zona": "Centro"})
    assert resp.status_code == 200
    args = mock_service.call_args[0]
    assert args[4] == "Centro"
    assert args[8] is False


def test_sucursal_delete(client):
    entity = {"type": "usuario"}
    mock_result = {"message": "Sucursal con id 1 eliminada"}
    with patch("controllers.sucursales.delete_sucursal", return_value=mock_result) as mock_delete:
        client.app.state.current_entity = entity
        resp = client.delete("/sucursales/1")
    assert resp.status_code == 200
    assert resp.json() == mock_result
    _, sucursal_id, current_entity = mock_delete.call_args[0]
    assert sucursal_id == 1
    assert current_entity == entity
