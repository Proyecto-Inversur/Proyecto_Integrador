from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from controllers import users, cuadrillas, sucursales, zonas, auth
from config.database import get_db
from services.auth import verify_user_token
from auth.firebase import initialize_firebase
from init_admin import init_admin
from dotenv import load_dotenv
import os

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_admin(
        email="2105905@ucc.edu.ar",
        nombre="Tomas",
        password="Jimbo132"
    )
    yield
    pass

app = FastAPI(lifespan=lifespan)

load_dotenv(dotenv_path="./env.config")
FRONTEND_URL = os.getenv("FRONTEND_URL")

# Configuración de CORS
origins = [
    FRONTEND_URL,  # Origen del frontend
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Permitir solicitudes desde estos orígenes
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],  # Permitir todos los encabezados
)

# Middleware de autenticación
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    # Excluir /auth/verify del middleware
    if request.url.path == "/auth/verify":
        response = await call_next(request)
        return response
    
    token = request.headers.get("Authorization")
    if token and token.startswith("Bearer "):
        token = token.replace("Bearer ", "")
        try:
            db = next(get_db())
            current_entity = verify_user_token(token, db)
            request.state.current_entity = current_entity
        except HTTPException as e:
            return {"status_code": e.status_code, "detail": e.detail}
        finally:
            db.close()
    else:
        request.state.current_entity = None
    response = await call_next(request)
    return response

app.include_router(users.router)
app.include_router(cuadrillas.router)
app.include_router(sucursales.router)
app.include_router(zonas.router)
app.include_router(auth.router)