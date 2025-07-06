from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from controllers import users, cuadrillas, sucursales, zonas, auth, preventivos, mantenimientos_preventivos, mantenimientos_correctivos, maps
from config.database import get_db
from services.auth import verify_user_token
from auth.firebase import initialize_firebase
from init_admin import init_admin
from dotenv import load_dotenv
import os
from starlette.responses import JSONResponse

load_dotenv(dotenv_path="./env.config")
FRONTEND_URL = os.getenv("FRONTEND_URL")
EMAIL_ADMIN = os.getenv("EMAIL_ADMIN")
NOMBRE_ADMIN = os.getenv("NOMBRE_ADMIN")
PASSWORD_ADMIN = os.getenv("PASSWORD_ADMIN")

@asynccontextmanager
async def lifespan(app: FastAPI):
    yield

app = FastAPI(lifespan=lifespan)

initialize_firebase()
init_admin(email=EMAIL_ADMIN, nombre=NOMBRE_ADMIN, password=PASSWORD_ADMIN)

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
    if request.url.path == "/auth/verify":
        return await call_next(request)
    
    # Allow OPTIONS requests for CORS preflight
    if request.method == "OPTIONS":
        return await call_next(request)
    
    if os.environ.get("TESTING") == "true":
        request.state.current_entity = {
            "type": "usuario",
            "data": {
                "id": 1,
                "nombre": "Test User",
                "email": "test@example.com",
                "rol": "Administrador"
            }
        }
    else:
        token = request.headers.get("Authorization")
        if token and token.startswith("Bearer "):
            token = token.replace("Bearer ", "")
            try:
                db = next(get_db())
                current_entity = verify_user_token(token, db)
                request.state.current_entity = current_entity
            except HTTPException as e:
                return JSONResponse(
                    content={"detail": e.detail},
                    status_code=e.status_code
                )
            except Exception as e:
                return JSONResponse(
                    content={"detail": f"Error interno en la verificación del token: {str(e)}"},
                    status_code=500
                )
            finally:
                db.close()
        else:
            request.state.current_entity = None
    
    try:
        response = await call_next(request)
        return response
    except Exception as e:
        return JSONResponse(
            content={"detail": "Error interno en el procesamiento de la solicitud"},
            status_code=500
        )

app.include_router(users.router)
app.include_router(cuadrillas.router)
app.include_router(sucursales.router)
app.include_router(zonas.router)
app.include_router(auth.router)
app.include_router(preventivos.router)
app.include_router(mantenimientos_preventivos.router)
app.include_router(mantenimientos_correctivos.router)
app.include_router(maps.router)