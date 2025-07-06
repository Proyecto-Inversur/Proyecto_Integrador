from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import List
from services.maps import get_sucursales_locations, get_users_locations, update_user_location

router = APIRouter(prefix="/maps", tags=["maps"])

class Direccion(BaseModel):
    id: str
    name: str
    lat: float
    lng: float

class LocationUpdate(BaseModel):
    lat: float
    lng: float
    name: str

@router.get("/sucursales-locations", response_model=List[Direccion])
async def locations_get(request: Request):
    current_entity = request.state.current_entity
    sucursales = await get_sucursales_locations(current_entity)
    return sucursales

@router.get("/users-locations", response_model=List[Direccion])
async def locations_get(request: Request):
    current_entity = request.state.current_entity
    users = await get_users_locations(current_entity)
    return users

@router.post("/update-user-location")
async def location_update(request: Request, location: LocationUpdate):
    current_entity = request.state.current_entity
    user_id = str(current_entity["data"]["id"])
    return await update_user_location(current_entity, user_id, location.name, location.lat, location.lng)