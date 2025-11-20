import os
import json
import asyncio
from starlette.requests import Request
from starlette.responses import Response
from fastapi import HTTPException
import src.api.routes as routes

os.environ["TESTING"] = "true"

app = routes.app

def build_request(path="/test", method="GET", headers=None):
    scope = {
        "type": "http",
        "scheme": "http",
        "method": method,
        "path": path,
        "root_path": "",
        "query_string": b"",
        "headers": headers or [],
        "client": ("testclient", 50000),
        "server": ("testserver", 80),
        "app": app,
    }
    return Request(scope)

async def dummy_call_next(request):
    return Response("ok")

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
        "/users",
        "/cuadrillas",
        "/sucursales",
        "/zonas",
        "/auth",
        "/clientes",
        "/mantenimientos-preventivos",
        "/mantenimientos-correctivos",
        "/maps",
        "/notificaciones",
        "/push",
        "/chat",
        "/preferences"
    ]

    app_routes = [route.path for route in app.routes]

    for expected in expected_routes:
        assert any(r.startswith(expected) for r in app_routes)

def test_lifespan_runs():
    async def run():
        async with routes.lifespan(app):
            return True
    assert asyncio.run(run())

def test_auth_middleware_options_request():
    request = build_request(method="OPTIONS")
    response = asyncio.run(routes.auth_middleware(request, dummy_call_next))
    assert response.status_code == 200

def test_auth_middleware_sets_default_entity_when_testing():
    request = build_request()
    response = asyncio.run(routes.auth_middleware(request, dummy_call_next))
    assert request.state.current_entity == routes.DEFAULT_TEST_ENTITY
    assert response.status_code == 200

def test_auth_middleware_valid_token(monkeypatch):
    class DummyDB:
        def close(self):
            pass

    def fake_get_db():
        yield DummyDB()

    monkeypatch.setenv("TESTING", "false")
    monkeypatch.setattr(routes, "get_db", fake_get_db)
    monkeypatch.setattr(routes, "verify_user_token", lambda token, db: {"user": "ok"})

    request = build_request(headers=[(b"authorization", b"Bearer token")])
    response = asyncio.run(routes.auth_middleware(request, dummy_call_next))
    assert request.state.current_entity == {"user": "ok"}
    assert response.status_code == 200

def test_auth_middleware_http_exception(monkeypatch):
    class DummyDB:
        def close(self):
            pass

    def fake_get_db():
        yield DummyDB()

    def fake_verify(token, db):
        raise HTTPException(status_code=403, detail="invalid")

    monkeypatch.setenv("TESTING", "false")
    monkeypatch.setattr(routes, "get_db", fake_get_db)
    monkeypatch.setattr(routes, "verify_user_token", fake_verify)

    request = build_request(headers=[(b"authorization", b"Bearer bad")])
    response = asyncio.run(routes.auth_middleware(request, dummy_call_next))
    assert response.status_code == 403
    assert json.loads(response.body) == {"detail": "invalid"}

def test_auth_middleware_call_next_exception():
    async def failing_call_next(request):
        raise Exception("boom")

    request = build_request()
    response = asyncio.run(routes.auth_middleware(request, failing_call_next))
    assert response.status_code == 500
