from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from config.database import get_db
from services.preferences import get_preferences, save_preferences
from api.schemas import ColumnPreferenceRead, ColumnPreferenceUpdate

router = APIRouter(prefix="/preferences", tags=["preferences"])


@router.get("/{page}", response_model=ColumnPreferenceRead)
def preferences_get(page: str, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    firebase_uid = str(current_entity["data"]["uid"]) if current_entity else ""
    columns = get_preferences(db, firebase_uid, page)
    return {"page": page, "columns": columns}


@router.put("/{page}", response_model=ColumnPreferenceRead)
def preferences_put(page: str, prefs: ColumnPreferenceUpdate, request: Request, db: Session = Depends(get_db)):
    current_entity = request.state.current_entity
    firebase_uid = str(current_entity["data"]["uid"]) if current_entity else ""
    columns = save_preferences(db, firebase_uid, page, prefs.columns)
    return {"page": page, "columns": columns}