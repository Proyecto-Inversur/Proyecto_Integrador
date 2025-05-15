import os

os.environ["TESTING"] = "true"
if os.path.exists("test.db"):
    os.remove("test.db")

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from src.api.routes import app
from src.api.models import Base
from src.config.database import get_db

# Configuramos la base de datos de testing
os.environ["DATABASE_URL"] = "sqlite:///:memory:"
DATABASE_URL = os.environ["DATABASE_URL"]

# Creamos el engine para testing
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# --- Fixtures ---

@pytest.fixture(scope="session", autouse=True)
def prepare_database():
    """Crea y destruye las tablas de la base de datos para toda la sesión de tests"""
    # Verificar que DATABASE_URL es in-memory
    assert os.environ["DATABASE_URL"] == "sqlite:///:memory:", "DATABASE_URL no está configurado como in-memory"
    
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def db_session():
    """Crea una sesión de base de datos nueva para cada test"""
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)

    yield session

    session.close()
    transaction.rollback()
    connection.close()

@pytest.fixture(scope="module")
def client():
    """Cliente de test que usa la base de datos de testing"""

    # Dependency override para que FastAPI use la DB de testing
    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db

    return TestClient(app)