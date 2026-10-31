from typing import List, Dict, Any, Optional
import uuid
from fastapi import HTTPException, status
from backend.app.database.mongodb import (
    get_messages_collection,
    get_conversations_collection,
    get_utc_now_iso,
)
from backend.app.services.conversation_service import conversation_service

class MessageService:
    async def create_message(
        self,
        user_id: str,
        conversation_id: str,
        sender: str,
        message_type: str,
        text: str,
        audio_url: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        fused_signals: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        # Validate conversation exists and belongs to current user
        await conversation_service.get_conversation(conversation_id, user_id)

        messages_coll = get_messages_collection()
        conversations_coll = get_conversations_collection()
        msg_id = "msg_" + uuid.uuid4().hex[:12]
        now = get_utc_now_iso()

        meta = dict(metadata or {})
        if fused_signals:
            meta["fusedSignals"] = fused_signals

        doc = {
            "_id": msg_id,
            "id": msg_id,
            "conversation_id": conversation_id,
            "session_id": conversation_id,
            "user_id": user_id,
            "sender": sender,
            "message_type": message_type,
            "type": message_type,
            "text": text,
            "content": text,
            "audio_url": audio_url,
            "metadata": meta,
            "fusedSignals": fused_signals,
            "timestamp": now[11:19],
            "created_at": now,
        }
        await messages_coll.insert_one(doc)

        # Update parent conversation summary
        try:
            total_msgs = await messages_coll.count_documents({
                "$or": [{"conversation_id": conversation_id}, {"session_id": conversation_id}]
            })
            await conversations_coll.update_one(
                {"$or": [{"_id": conversation_id}, {"id": conversation_id}]},
                {"$set": {
                    "messages_count": total_msgs,
                    "last_message_preview": text[:120],
                    "updated_at": now,
                }}
            )
        except Exception:
            pass

        return doc

    async def get_messages(
        self,
        conversation_id: str,
        user_id: str,
        skip: int = 0,
        limit: int = 100,
    ) -> List[Dict[str, Any]]:
        # Verify ownership
        await conversation_service.get_conversation(conversation_id, user_id)

        messages_coll = get_messages_collection()
        cursor = messages_coll.find({
            "$or": [{"conversation_id": conversation_id}, {"session_id": conversation_id}]
        })
        cursor.sort("created_at", 1).skip(skip).limit(limit)
        items = await cursor.to_list()

        for item in items:
            item["id"] = str(item.get("_id", item.get("id")))
            item["content"] = item.get("text", item.get("content", ""))
            item["text"] = item.get("content", "")
            item["type"] = item.get("message_type", item.get("type", "text"))
            item["message_type"] = item["type"]
            if "metadata" in item and "fusedSignals" in item["metadata"]:
                item["fusedSignals"] = item["metadata"]["fusedSignals"]
        return items

message_service = MessageService()

