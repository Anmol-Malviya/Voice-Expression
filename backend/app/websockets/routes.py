import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from backend.app.websockets.connection_manager import ws_manager
from backend.app.services.gesture.recognizer import gesture_service

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

@ws_router.websocket("/ws/gesture")
@ws_router.websocket("/api/v1/gesture/ws")
async def gesture_websocket_endpoint(websocket: WebSocket):
    """
    Real-time multimodal gesture recognition WebSocket.
    Processes live video frames and landmark streams with ephemeral memory processing.
    Emits continuous classification, confidence scores, and skeletal landmarks.
    """
    await websocket.accept()
    logger.info("Gesture WebSocket client connected.")
    try:
        await websocket.send_text(json.dumps({
            "type": "gesture.ready",
            "status": "connected",
            "message": "Live multimodal gesture recognition WebSocket ready."
        }))

        while True:
            data_text = await websocket.receive_text()
            try:
                message = json.loads(data_text)
                msg_type = message.get("type", "frame")

                if msg_type == "ping":
                    await websocket.send_text(json.dumps({"type": "pong"}))
                    continue

                if msg_type == "reset":
                    gesture_service.classify_landmarks([]) # resets or flushes
                    await websocket.send_text(json.dumps({"type": "gesture.reset_ack"}))
                    continue

                # Process frame or landmarks
                image_data = message.get("image") or message.get("image_data")
                landmarks = message.get("landmarks")
                gesture_name = message.get("gesture_name")

                result = gesture_service.recognize_gesture(
                    gesture_name=gesture_name,
                    image_data=image_data,
                    landmarks=landmarks,
                    generate_suggestions=True
                )

                await websocket.send_text(json.dumps({
                    "type": "gesture.result",
                    "data": result
                }))

            except json.JSONDecodeError:
                logger.warning(f"Malformed JSON on gesture WebSocket: {data_text[:100]}")
            except Exception as e:
                logger.error(f"Error handling gesture WebSocket message: {e}")
                await websocket.send_text(json.dumps({
                    "type": "gesture.error",
                    "error": str(e)
                }))

    except WebSocketDisconnect:
        logger.info("Gesture WebSocket client disconnected.")
    except Exception as e:
        logger.error(f"Unexpected error in gesture WebSocket: {e}")
