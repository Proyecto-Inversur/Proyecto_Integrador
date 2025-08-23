import pytest
from fastapi import HTTPException
from src.services import push_subscriptions as ps
from src.api.schemas import PushSubscriptionCreate, PushSubscriptionKeys

def test_save_subscription(db_session):
    sub = PushSubscriptionCreate(
        endpoint="e",
        keys=PushSubscriptionKeys(p256dh="p", auth="a"),
        firebase_uid="uid",
        device_info="web",
    )

    result = ps.save_subscription(db_session, {"type": "usuario"}, sub)

    assert result["message"] == "Subscription saved"
    assert len(ps.get_subscriptions(db_session, "uid")) == 1

def test_get_subscriptions(db_session):
    sub1 = PushSubscriptionCreate(
        endpoint="e1",
        keys=PushSubscriptionKeys(p256dh="p1", auth="a1"),
        firebase_uid="uid",
        device_info="web",
    )
    sub2 = PushSubscriptionCreate(
        endpoint="e2",
        keys=PushSubscriptionKeys(p256dh="p2", auth="a2"),
        firebase_uid="uid",
        device_info="mobile",
    )

    ps.save_subscription(db_session, {"type": "usuario"}, sub1)
    ps.save_subscription(db_session, {"type": "usuario"}, sub2)

    subs = ps.get_subscriptions(db_session, "uid")

    assert len(subs) == 2
    assert {s.endpoint for s in subs} == {"e1", "e2"}

def test_delete_subscription(db_session):
    sub = PushSubscriptionCreate(
        endpoint="e",
        keys=PushSubscriptionKeys(p256dh="p", auth="a"),
        firebase_uid="uid",
        device_info="web",
    )

    ps.save_subscription(db_session, {"type": "usuario"}, sub)

    result = ps.delete_subscription(db_session, "e")

    assert result["message"] == "Subscription deleted"
    assert ps.get_subscriptions(db_session, "uid") == []

def test_save_subscription_without_auth(db_session):
    sub = PushSubscriptionCreate(
        endpoint="e", keys=PushSubscriptionKeys(p256dh="p", auth="a"), firebase_uid="uid", device_info="web"
    )
    with pytest.raises(HTTPException) as exc:
        ps.save_subscription(db_session, None, sub)
    assert exc.value.status_code == 401

def test_get_subscriptions_empty(db_session):
    subs = ps.get_subscriptions(db_session, "uid")
    assert subs == []

def test_delete_subscription_not_found(db_session):
    sub = PushSubscriptionCreate(
        endpoint="e", keys=PushSubscriptionKeys(p256dh="p", auth="a"), firebase_uid="uid", device_info="web"
    )
    ps.save_subscription(db_session, {"type": "usuario"}, sub)
    result = ps.delete_subscription(db_session, "unknown")
    assert result["message"] == "Subscription deleted"
    assert len(ps.get_subscriptions(db_session, "uid")) == 1
