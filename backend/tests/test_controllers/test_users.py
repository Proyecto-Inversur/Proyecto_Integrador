from unittest.mock import patch, MagicMock

def test_list_users(client):
    u = MagicMock(id=1, nombre="N", email="c@x.com", rol="Administrador")
    with patch("controllers.users.get_users", return_value=[u]):
        resp = client.get("/users/")
    assert resp.status_code == 200
    assert resp.json()[0] == {"id": 1, "nombre": "N", "email": "c@x.com", "rol": "Administrador"}

def test_get_user(client):
    u = MagicMock(id=1, nombre="N", email="c@x.com", rol="Administrador")
    with patch("controllers.users.get_user", return_value=u):
        resp = client.get("/users/1")
    assert resp.status_code == 200
    assert resp.json() == {"id": 1, "nombre": "N", "email": "c@x.com", "rol": "Administrador"}
