import asyncio
from src.services.chat_ws import ChatConnectionManager
from src.services.notification_ws import NotificationConnectionManager

class DummyWebSocket:
    def __init__(self):
        self.accepted = False
        self.messages = []

    async def accept(self):
        self.accepted = True

    async def send_json(self, message):
        self.messages.append(message)

def test_chat_connection_manager_active_connections():
    websocket = DummyWebSocket()
    manager = ChatConnectionManager()

    asyncio.run(manager.connect(1, websocket))
    assert websocket.accepted
    assert manager.active_connections == {1: [websocket]}

    message = {"content": "hello"}
    asyncio.run(manager.send_message(1, message))
    assert websocket.messages == [message]

    manager.disconnect(1, websocket)
    assert manager.active_connections == {}

def test_chat_connection_manager_no_connections():
    manager = ChatConnectionManager()
    asyncio.run(manager.send_message(1, {"content": "hello"}))
    assert manager.active_connections == {}

def test_chat_connection_manager_disconnect_unknown():
    manager = ChatConnectionManager()
    websocket = DummyWebSocket()
    manager.disconnect(1, websocket)
    assert manager.active_connections == {}

def test_notification_connection_manager_active_connections():
    websocket = DummyWebSocket()
    manager = NotificationConnectionManager()

    asyncio.run(manager.connect("uid", websocket))
    assert websocket.accepted
    assert manager.active_connections == {"uid": [websocket]}

    message = {"content": "notify"}
    asyncio.run(manager.send_notification("uid", message))
    assert websocket.messages == [message]

    manager.disconnect("uid", websocket)
    assert manager.active_connections == {}

def test_notification_connection_manager_no_connections():
    manager = NotificationConnectionManager()
    asyncio.run(manager.send_notification("uid", {"content": "notify"}))
    assert manager.active_connections == {}

def test_notification_connection_manager_disconnect_unknown():
    manager = NotificationConnectionManager()
    websocket = DummyWebSocket()
    manager.disconnect("uid", websocket)
    assert manager.active_connections == {}