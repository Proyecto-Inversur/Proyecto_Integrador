import pytest
from fastapi.testclient import TestClient
from src.api.routes import app

client = TestClient(app)

def test_app_instance():
    """ Verifica que la instancia de app es de FastAPI """
    assert app.title is not None

def test_cors_middleware_exists():
    """ Verifica que CORS Middleware está en la app """
    middleware_names = [middleware.cls.__name__ for middleware in app.user_middleware]
    assert "CORSMiddleware" in middleware_names

def test_routes_registered():
    """ Verifica que se registraron los routers principales """
    expected_routes = [
        "/sucursales",
        "/zonas",
        "/users",
        "/cuadrillas",
        "/auth"
    ]

    app_routes = [route.path for route in app.routes]

    for expected in expected_routes:
        assert any(r.startswith(expected) for r in app_routes)
