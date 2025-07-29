import json
import os
from pywebpush import webpush, WebPushException
from dotenv import load_dotenv
from sqlalchemy.orm import Session
from api.models import PushSubscription

load_dotenv(dotenv_path="./env.config")
VAPID_PRIVATE_KEY = os.getenv("VAPID_PRIVATE_KEY")


def send_webpush_notification(db_session: Session, firebase_uid: str, title: str, body: str):
    if not VAPID_PRIVATE_KEY:
        return {"message": "Web push not configured"}
    
    subscriptions = db_session.query(PushSubscription).filter(PushSubscription.firebase_uid == firebase_uid).all()
    payload = json.dumps({"title": title, "body": body})
    for sub in subscriptions:
        subscription_info = {
            "endpoint": sub.endpoint,
            "keys": {"p256dh": sub.p256dh, "auth": sub.auth}
        }
        try:
            webpush(
                subscription_info,
                payload,
                vapid_private_key=VAPID_PRIVATE_KEY,
                vapid_claims={"sub": "mailto:admin@example.com"}
            )
        except Exception as exc:
            continue
    return {"message": "Web push sent"}
