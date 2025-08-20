import os
import sys
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

# Configurar variables de entorno antes de importar la aplicación
os.environ["DATABASE_URL"] = "sqlite:///./test.db"
os.environ["TESTING"] = "true"
os.environ.setdefault("GOOGLE_CREDENTIALS", "{}")
os.environ.setdefault("GOOGLE_CLOUD_BUCKET_NAME", "test-bucket")

# Asegurar que los paquetes del backend sean importables
BASE_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(BASE_DIR))
sys.path.append(str(BASE_DIR / "src"))

from src.api.routes import app
from src.api.models import Base
from src.config.database import SessionLocal as AppSessionLocal, engine as app_engine, get_db

engine = app_engine
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def prepare_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db

    return TestClient(app)

@pytest.fixture(autouse=True)
def mock_firebase(monkeypatch):
    class DummyReference:
        def __init__(self, *args, **kwargs):
            pass

        def get(self):
            return {}

        def set(self, *args, **kwargs):
            pass

        def update(self, *args, **kwargs):
            pass

        def delete(self, *args, **kwargs):
            pass

    def dummy_reference(*args, **kwargs):
        return DummyReference()

    monkeypatch.setattr("firebase_admin.db.reference", dummy_reference)
    monkeypatch.setattr("src.services.sucursales.initialize_firebase", lambda: None)
    monkeypatch.setattr("src.services.maps.initialize_firebase", lambda: None)
    