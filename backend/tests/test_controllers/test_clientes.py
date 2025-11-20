from unittest.mock import ANY, MagicMock, patch


def _cliente_mock():
    return MagicMock(id=1, nombre="ACME", contacto="Jane", email="user@example.com")


def test_clientes_get(client):
    cliente = _cliente_mock()
    with patch("controllers.clientes.get_clientes", return_value=[cliente]) as mock_get:
        resp = client.get("/clientes/")
    assert resp.status_code == 200
    assert resp.json()[0] == {
        "id": 1,
        "nombre": "ACME",
        "contacto": "Jane",
        "email": "user@example.com",
    }
    mock_get.assert_called_once_with(ANY)


def test_cliente_get(client):
    cliente = _cliente_mock()
    with patch("controllers.clientes.get_cliente", return_value=cliente) as mock_get:
        resp = client.get("/clientes/1")
    assert resp.status_code == 200
    assert resp.json()["contacto"] == "Jane"
    mock_get.assert_called_once_with(ANY, 1)


def test_cliente_create_uses_current_entity(client):
    cliente = _cliente_mock()
    entity = {"type": "usuario", "data": {"id": 7}}
    with patch("controllers.clientes.create_cliente", return_value=cliente) as mock_create:
        client.app.state.current_entity = entity
        payload = {"nombre": "ACME", "contacto": "Jane", "email": "user@example.com"}
        resp = client.post("/clientes/", json=payload)
    assert resp.status_code == 200
    assert resp.json()["email"] == "user@example.com"
    mock_create.assert_called_once()
    _, nombre, contacto, email, current_entity = mock_create.call_args[0]
    assert (nombre, contacto, email) == ("ACME", "Jane", "user@example.com")
    assert current_entity == entity


def test_cliente_update_passes_partial_fields(client):
    cliente = _cliente_mock()
    entity = {"type": "usuario"}
    with patch("controllers.clientes.update_cliente", return_value=cliente) as mock_update:
        client.app.state.current_entity = entity
        payload = {"nombre": "Nuevo nombre"}
        resp = client.put("/clientes/1", json=payload)
    assert resp.status_code == 200
    assert resp.json()["id"] == 1
    mock_update.assert_called_once()
    _, cliente_id, current_entity, nombre, contacto, email = mock_update.call_args[0]
    assert cliente_id == 1
    assert current_entity == entity
    assert nombre == "Nuevo nombre"
    assert contacto is None
    assert email is None


def test_cliente_delete_uses_current_entity(client):
    entity = {"type": "usuario"}
    result = {"message": "Cliente con id 1 eliminado"}
    with patch("controllers.clientes.delete_cliente", return_value=result) as mock_delete:
        client.app.state.current_entity = entity
        resp = client.delete("/clientes/1")
    assert resp.status_code == 200
    assert resp.json() == result
    mock_delete.assert_called_once()
    _, cliente_id, current_entity = mock_delete.call_args[0]
    assert cliente_id == 1
    assert current_entity == entity
