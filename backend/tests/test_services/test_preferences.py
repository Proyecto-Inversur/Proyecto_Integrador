import pytest
from src.services import preferences as pref_service
from src.api.models import ColumnPreference

def test_get_preferences_empty(db_session):
    assert pref_service.get_preferences(db_session, "uid", "page") == []

def test_get_preferences_invalid_json(db_session):
    db_session.add(ColumnPreference(firebase_uid="uid", page="page", columns="not json"))
    db_session.commit()
    assert pref_service.get_preferences(db_session, "uid", "page") == []

def test_get_preferences_success(db_session):
    db_session.add(ColumnPreference(firebase_uid="uid", page="page", columns='["a", "b"]'))
    db_session.commit()
    assert pref_service.get_preferences(db_session, "uid", "page") == ["a", "b"]

def test_save_preferences_create(db_session):
    result = pref_service.save_preferences(db_session, "uid", "page", ["a", "b"])
    assert result == ["a", "b"]
    pref = db_session.query(ColumnPreference).filter_by(firebase_uid="uid", page="page").first()
    assert pref is not None
    assert pref.columns == '["a", "b"]'

def test_save_preferences_update(db_session):
    db_session.add(ColumnPreference(firebase_uid="uid", page="page", columns='["a"]'))
    db_session.commit()
    result = pref_service.save_preferences(db_session, "uid", "page", ["b"])
    assert result == ["b"]
    pref = db_session.query(ColumnPreference).filter_by(firebase_uid="uid", page="page").first()
    assert pref.columns == '["b"]'
