from sqlalchemy.orm import Session
from api.models import ColumnPreference
import json


def get_preferences(db: Session, firebase_uid: str, page: str):
    pref = db.query(ColumnPreference).filter_by(firebase_uid=firebase_uid, page=page).first()
    if not pref:
        return []
    try:
        return json.loads(pref.columns)
    except json.JSONDecodeError:
        return []


def save_preferences(db: Session, firebase_uid: str, page: str, columns: list[str]):
    pref = db.query(ColumnPreference).filter_by(firebase_uid=firebase_uid, page=page).first()
    data = json.dumps(columns)
    if pref:
        pref.columns = data
    else:
        pref = ColumnPreference(firebase_uid=firebase_uid, page=page, columns=data)
        db.add(pref)
    db.commit()
    db.refresh(pref)
    try:
        return json.loads(pref.columns)
    except json.JSONDecodeError:
        return []