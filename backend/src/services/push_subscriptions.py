from fastapi import HTTPException
from sqlalchemy.orm import Session
from api.models import PushSubscription
from api.schemas import PushSubscriptionCreate

def save_subscription(db_session: Session, current_entity: dict, sub: PushSubscriptionCreate):
    if not current_entity:
        raise HTTPException(status_code=401, detail="Autenticación requerida")

    db_session.query(PushSubscription).filter(PushSubscription.endpoint == sub.endpoint).delete()

    db_sub = PushSubscription(
        firebase_uid=sub.firebase_uid,
        endpoint=sub.endpoint,
        p256dh=sub.keys.p256dh,
        auth=sub.keys.auth,
        device_info=sub.device_info,
    )
    db_session.add(db_sub)
    db_session.commit()
    db_session.refresh(db_sub)

    return {"message": "Subscription saved"}


def get_subscriptions(db_session: Session, firebase_uid: str):
    return db_session.query(PushSubscription).filter(PushSubscription.firebase_uid == firebase_uid).all()
