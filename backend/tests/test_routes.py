import pytest
import os
from fastapi.testclient import TestClient
from fastapi import HTTPException
from src.api.routes import app, lifespan
from src.services.auth import verify_user_token
from src.init_admin import init_admin
from starlette.responses import JSONResponse
from starlette.responses import Response

client = TestClient(app)

@pytest.fixture(autouse=True)
def reset_env():
    """Reset environment variables before each test"""
    if "TESTING" in os.environ:
        del os.environ["TESTING"]
    if "FRONTEND_URL" in os.environ:
        del os.environ["FRONTEND_URL"]
    yield

def test_app_instance():
    """Verifica que la instancia de app es de FastAPI"""
    from fastapi import FastAPI
    assert isinstance(app, FastAPI)
    assert app.title is not None

def test_routes_registered():
    """Verifica que se registraron los routers principales"""
    expected_routes = [
        "/sucursales",
        "/zonas",
        "/users",
        "/cuadrillas",
        "/auth"
    ]
    app_routes = [route.path for route in app.routes]
    for expected in expected_routes:
        assert any(r.startswith(expected) for r in app_routes), f"Route {expected} not found"

def test_auth_middleware_testing_mode(monkeypatch):
    """Verifica el middleware en modo TESTING"""
    monkeypatch.setenv("TESTING", "true")
    response = client.get("/users/", headers={"Authorization": "Bearer invalid-token"})
    assert response.status_code == 200  # Should bypass token verification
    # Can't assert request.state.current_entity directly, but route would fail if not set

def test_auth_middleware_verify_path_bypass(mocker):
    """Verifica que /auth/verify bypasses el middleware"""
    mock_verify = mocker.patch("src.services.auth.verify_user_token")
    response = client.post("/auth/verify", json={"token": "test-token"})
    mock_verify.assert_not_called()
    # Response depends on auth.verify implementation, so we only check the call

def test_auth_middleware_db_session_closed(mocker):
    """Verifica que el middleware cierra la sesión de la base de datos"""
    mock_db = mocker.MagicMock()
    mock_db_close = mocker.patch.object(mock_db, "close")
    mocker.patch("src.api.routes.get_db", return_value=iter([mock_db]))
    mocker.patch(
        "src.services.auth.verify_user_token",
        return_value={
            "type": "usuario",
            "data": {"id": 1, "nombre": "Test", "email": "test@example.com", "rol": "Administrador"}
        }
    )
    client.get("/users/", headers={"Authorization": "Bearer valid-token"})
    mock_db_close.assert_called_once()