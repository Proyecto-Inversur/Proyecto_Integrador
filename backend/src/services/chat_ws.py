from typing import Dict, List
from fastapi import WebSocket


class ChatConnectionManager:
    """Manage websocket connections per mantenimiento."""

    def __init__(self) -> None:
        self.active_connections: Dict[int, List[WebSocket]] = {}

    async def connect(self, mantenimiento_id: int, websocket: WebSocket) -> None:
        """Accept and store a new websocket connection."""
        await websocket.accept()
        self.active_connections.setdefault(mantenimiento_id, []).append(websocket)

    def disconnect(self, mantenimiento_id: int, websocket: WebSocket) -> None:
        """Remove a websocket connection for the given mantenimiento."""
        connections = self.active_connections.get(mantenimiento_id, [])
        if websocket in connections:
            connections.remove(websocket)
        if not connections and mantenimiento_id in self.active_connections:
            del self.active_connections[mantenimiento_id]

    async def send_message(self, mantenimiento_id: int, message: dict) -> None:
        """Send a message to all connections of a mantenimiento."""
        connections = self.active_connections.get(mantenimiento_id, [])
        for connection in connections:
            await connection.send_json(message)

chat_manager = ChatConnectionManager()
