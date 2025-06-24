from fastapi import APIRouter, Request
from pydantic import BaseModel
from typing import List
from services.maps import get_locations, update_location

router = APIRouter(prefix="/maps", tags=["maps"])

class User(BaseModel):
    id: str
    name: str
    lat: float
    lng: float

class LocationUpdate(BaseModel):
    lat: float
    lng: float
    name: str

@router.get("/locations", response_model=List[User])
async def locations_get(request: Request):
    current_entity = request.state.current_entity
    users = await get_locations(current_entity)
    return users

@router.post("/update-location")
async def location_update(request: Request, location: LocationUpdate):
    current_entity = request.state.current_entity
    user_id = str(current_entity["data"]["id"])
    return await update_location(current_entity, user_id, location.name, location.lat, location.lng)