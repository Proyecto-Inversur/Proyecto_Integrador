from unittest.mock import patch, MagicMock

def test_push_subscribe(client):
    mock_result = {"message": "Subscription saved"}
    with patch("controllers.push.save_subscription", return_value=mock_result):
        payload = {
            "endpoint": "e",
            "keys": {"p256dh": "p", "auth": "a"},
            "firebase_uid": "uid",
            "device_info": "d",
        }
        resp = client.post("/push/subscribe", json=payload)
    assert resp.status_code == 200
    assert resp.json() == mock_result

def test_push_get(client):
    sub = MagicMock(id=1, endpoint="e")
    with patch("controllers.push.get_subscriptions", return_value=[sub]):
        resp = client.get("/push/subscriptions/uid")
    assert resp.status_code == 200
    assert resp.json()[0] == {"id": 1, "endpoint": "e"}

def test_push_delete(client):
    mock_result = {"message": "Subscription deleted"}
    with patch("controllers.push.delete_subscription", return_value=mock_result):
        resp = client.delete("/push/unsubscribe?endpoint=e")
    assert resp.status_code == 200
    assert resp.json() == mock_result
