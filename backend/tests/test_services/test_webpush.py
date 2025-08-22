from unittest.mock import patch
import importlib
import src.services.webpush as webpush_service
from src.api.models import PushSubscription

def test_send_webpush_success(monkeypatch, db_session):
    monkeypatch.setenv("VAPID_PRIVATE_KEY", "test-key")
    importlib.reload(webpush_service)
    db_session.add(
        PushSubscription(firebase_uid="uid", endpoint="e", p256dh="p", auth="a")
    )
    db_session.commit()

    with patch("src.services.webpush.webpush") as mock_push:
        result = webpush_service.send_webpush_notification(
            db_session, "uid", "title", "body"
        )
        assert result == {"message": "Web push sent"}
        mock_push.assert_called_once()

def test_send_webpush_not_configured(monkeypatch, db_session):
    monkeypatch.delenv("VAPID_PRIVATE_KEY", raising=False)
    importlib.reload(webpush_service)
    result = webpush_service.send_webpush_notification(
        db_session, "uid", "title", "body"
    )
    assert result == {"message": "Web push not configured"}

def test_send_webpush_handles_error(monkeypatch, db_session):
    monkeypatch.setenv("VAPID_PRIVATE_KEY", "test-key")
    importlib.reload(webpush_service)
    db_session.add(
        PushSubscription(firebase_uid="uid", endpoint="e", p256dh="p", auth="a")
    )
    db_session.commit()

    with patch("src.services.webpush.webpush", side_effect=Exception("fail")) as mock_push:
        result = webpush_service.send_webpush_notification(
            db_session, "uid", "title", "body"
        )
        assert result == {"message": "Web push sent"}
        mock_push.assert_called_once()
