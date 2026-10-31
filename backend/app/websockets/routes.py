import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.app.websockets.connection_manager import ws_manager

logger = logging.getLogger("voice_expression.ws_routes")
ws_router = APIRouter()

@ws_router.websocket("/ws/conversation/{conversation_id}")
@ws_router.websocket("/ws/sessions/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: str):
    await ws_manager.connect(conversation_id, websocket)
    try:
        # Send initial welcome / connected status
        await websocket.send_text(json.dumps({
            "type": "connection.ready",
            "data": {
                "session_id": conversation_id,
                "status": "connected",
                "message": "Live multimodal session connected"
            }
        }))

        while True:
            data_text = await websocket.receive_text()
            try:
                event = json.loads(data_text)
                event_type = event.get("type", "message")
                payload = event.get("data", {})

                if event_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong", "data": {}}))
                
                elif event_type in ["transcript.partial", "vision.status", "confirmation.updated"]:
                    # Echo / broadcast to room
                    await ws_manager.broadcast_to_room(conversation_id, event_type, payload)

            except json.JSONDecodeError:
                logger.warning(f"Malformed JSON on websocket {conversation_id}: {data_text}")

    except WebSocketDisconnect:
        ws_manager.disconnect(conversation_id, websocket)
    except Exception as e:
        logger.error(f"WebSocket error in {conversation_id}: {e}")
        ws_manager.disconnect(conversation_id, websocket)

