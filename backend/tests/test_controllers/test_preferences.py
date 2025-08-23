from unittest.mock import patch

def test_preferences_get(client):
    with patch("controllers.preferences.get_preferences", return_value=["a", "b"]):
        resp = client.get("/preferences/my-page")
    assert resp.status_code == 200
    assert resp.json() == {"page": "my-page", "columns": ["a", "b"]}

def test_preferences_put(client):
    payload = {"columns": ["a", "b"]}
    with patch("controllers.preferences.save_preferences", return_value=["a", "b"]):
        resp = client.put("/preferences/my-page", json=payload)
    assert resp.status_code == 200
    assert resp.json() == {"page": "my-page", "columns": ["a", "b"]}
