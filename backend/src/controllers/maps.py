from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from config.database import get_db
from pydantic import BaseModel
from typing import List
from services.maps import get_sucursales_locations, get_users_locations, get_correctivos, get_preventivos, update_user_location, update_correctivo, update_preventivo, delete_sucursal, delete_correctivo, delete_preventivo, delete_selection

router = APIRouter(prefix="/maps", tags=["maps"])

class LocationUpdate(BaseModel):
    lat: float
    lng: float
    name: str

class Seleccion(BaseModel):
    id_mantenimiento: int
    id_sucursal: int

@router.get("/sucursales-locations", response_model=List[dict])
async def locations_get(request: Request):
    current_entity = request.state.current_entity
    sucursales = await get_sucursales_locations(current_entity)
    return [{"id": s.id, "name": s.name, "lat": s.lat, "lng": s.lng} for s in sucursales]

@router.get("/users-locations", response_model=List[dict])
async def locations_get(request: Request):
    current_entity = request.state.current_entity
    users = await get_users_locations(current_entity)
    return [{"id": u.id, "tipo": u.tipo, "name": u.name, "lat": u.lat, "lng": u.lng} for u in users]

@router.get("/correctivo-selection/{id_cuadrilla}", response_model=List[dict])
def correctivo_get(request: Request, id_cuadrilla: int = None, db_session: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    correctivos_ids = get_correctivos(db_session, id_cuadrilla, current_entity)
    return [{"id_mantenimiento": c.id_mantenimiento, "id_sucursal": c.id_sucursal} for c in correctivos_ids]

@router.get("/preventivo-selection/{id_cuadrilla}", response_model=List[dict])
def preventivo_get(request: Request, id_cuadrilla: int, db_session: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    preventivos_ids = get_preventivos(db_session, id_cuadrilla, current_entity)
    return [{"id_mantenimiento": p.id_mantenimiento, "id_sucursal": p.id_sucursal} for p in preventivos_ids]

@router.post("/update-user-location", response_model=dict)
async def location_update(request: Request, location: LocationUpdate):
    current_entity = request.state.current_entity
    firebase_uid = str(current_entity["data"]["uid"])
    user_id = str(current_entity["data"]["id"])
    if current_entity["type"] == "usuario":
        tipo = str(current_entity["data"]["rol"])
    else:
        tipo = str(current_entity["type"])
    return await update_user_location(current_entity, firebase_uid, user_id, tipo, location.name, location.lat, location.lng)

@router.post("/select-correctivo", response_model=dict)
def correctivo_update(request: Request, s: Seleccion, db_session: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    id_cuadrilla = int(current_entity["data"]["id"])
    seleccion = update_correctivo(db_session, id_cuadrilla, s.id_mantenimiento, s.id_sucursal, current_entity)
    return {"id": seleccion.id, "id_cuadrilla": seleccion.id_cuadrilla, "id_mantenimiento": seleccion.id_mantenimiento, "id_sucursal": seleccion.id_sucursal}

@router.post("/select-preventivo", response_model=dict)
def preventivo_update(request: Request, s: Seleccion, db_session: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    id_cuadrilla = int(current_entity["data"]["id"])
    seleccion = update_preventivo(db_session, id_cuadrilla, s.id_mantenimiento, s.id_sucursal, current_entity)
    return {"id": seleccion.id, "id_cuadrilla": seleccion.id_cuadrilla, "id_mantenimiento": seleccion.id_mantenimiento, "id_sucursal": seleccion.id_sucursal}

@router.delete("/sucursal/{id_sucursal}", response_model=dict)
def sucursal_delete(request: Request, id_sucursal: int, db_session: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    id_cuadrilla = int(current_entity["data"]["id"])
    return delete_sucursal(db_session, id_cuadrilla, id_sucursal, current_entity)

@router.delete("/correctivo/{id_mantenimiento}", response_model=dict)
def correctivo_delete(request: Request, id_mantenimiento: int, db_session: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    id_cuadrilla = int(current_entity["data"]["id"])
    return delete_correctivo(db_session, id_cuadrilla, id_mantenimiento, current_entity)

@router.delete("/preventivo/{id_mantenimiento}", response_model=dict)
def preventivo_delete(request: Request, id_mantenimiento: int, db_session: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    id_cuadrilla = int(current_entity["data"]["id"])
    return delete_preventivo(db_session, id_cuadrilla, id_mantenimiento, current_entity)

@router.delete("/selection", response_model=dict)
def selection_delete(request: Request, db_session: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    id_cuadrilla = int(current_entity["data"]["id"])
    return delete_selection(db_session, id_cuadrilla, current_entity)