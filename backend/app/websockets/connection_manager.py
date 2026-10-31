import json
import logging
from typing import Dict, Set
from fastapi import WebSocket

logger = logging.getLogger("voice_expression.websocket")

class ConnectionManager:
    def __init__(self):
        # Maps session_id/conversation_id -> Set of active WebSocket connections
        self.rooms: Dict[str, Set[WebSocket]] = {}

    async def connect(self, session_id: str, websocket: WebSocket):
        await websocket.accept()
        if session_id not in self.rooms:
            self.rooms[session_id] = set()
        self.rooms[session_id].add(websocket)
        logger.info(f"WebSocket client joined session room: {session_id}")

    def disconnect(self, session_id: str, websocket: WebSocket):
        if session_id in self.rooms and websocket in self.rooms[session_id]:
            self.rooms[session_id].remove(websocket)
            if not self.rooms[session_id]:
                del self.rooms[session_id]
        logger.info(f"WebSocket client left session room: {session_id}")

    async def broadcast_to_room(self, session_id: str, event_type: str, payload: dict):
        if session_id in self.rooms:
            message = json.dumps({"type": event_type, "data": payload})
            stale_sockets = []
            for connection in self.rooms[session_id]:
                try:
                    await connection.send_text(message)
                except Exception as e:
                    logger.warning(f"Failed to send to socket in {session_id}: {e}")
                    stale_sockets.append(connection)
            for s in stale_sockets:
                self.rooms[session_id].discard(s)

ws_manager = ConnectionManager()

