from typing import Dict, List
from fastapi import WebSocket


class NotificationConnectionManager:
    """Manage websocket connections per firebase UID."""

    def __init__(self) -> None:
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, firebase_uid: str, websocket: WebSocket) -> None:
        """Accept and store a new websocket connection."""
        await websocket.accept()
        self.active_connections.setdefault(firebase_uid, []).append(websocket)

    def disconnect(self, firebase_uid: str, websocket: WebSocket) -> None:
        """Remove a websocket connection for the given firebase UID."""
        connections = self.active_connections.get(firebase_uid, [])
        if websocket in connections:
            connections.remove(websocket)
        if not connections and firebase_uid in self.active_connections:
            del self.active_connections[firebase_uid]

    async def send_notification(self, firebase_uid: str, message: dict) -> None:
        """Send a notification to all connections of a firebase UID."""
        connections = self.active_connections.get(firebase_uid, [])
        for connection in connections:
            await connection.send_json(message)

notification_manager = NotificationConnectionManager()