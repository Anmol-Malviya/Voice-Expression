from typing import List, Dict, Any, Optional
import uuid
from fastapi import HTTPException, status
from backend.app.database.mongodb import (
    get_conversations_collection,
    get_messages_collection,
    get_utc_now_iso,
)

class ConversationService:
    async def create_conversation(
        self,
        user_id: str,
        title: Optional[str] = "Live Assistive Session",
        language: str = "en",
        mode: str = "live_conversation",
    ) -> Dict[str, Any]:
        conversations_coll = get_conversations_collection()
        conv_id = "sess_" + uuid.uuid4().hex[:12]
        now = get_utc_now_iso()

        doc = {
            "_id": conv_id,
            "id": conv_id,
            "user_id": user_id,
            "title": title or "Live Assistive Session",
            "language": language,
            "mode": mode,
            "status": "active",
            "messages_count": 0,
            "last_message_preview": None,
            "created_at": now,
            "updated_at": now,
        }
        await conversations_coll.insert_one(doc)
        return doc

    async def list_conversations(
        self,
        user_id: str,
        skip: int = 0,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        conversations_coll = get_conversations_collection()
        # Enforce user ownership
        cursor = conversations_coll.find({"user_id": user_id})
        cursor.sort("updated_at", -1).skip(skip).limit(limit)
        items = await cursor.to_list()
        
        # Normalize IDs
        for item in items:
            item["id"] = str(item.get("_id", item.get("id")))
        return items

    async def get_conversation(self, conversation_id: str, user_id: str) -> Dict[str, Any]:
        conversations_coll = get_conversations_collection()
        conv = await conversations_coll.find_one({
            "$or": [{"_id": conversation_id}, {"id": conversation_id}]
        })
        if not conv:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found.")
        
        # Verify ownership
        if conv.get("user_id") and conv.get("user_id") != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied to this conversation.")

        conv["id"] = str(conv.get("_id", conversation_id))
        return conv

    async def update_conversation(
        self,
        conversation_id: str,
        user_id: str,
        updates: Dict[str, Any],
    ) -> Dict[str, Any]:
        # Ownership check
        await self.get_conversation(conversation_id, user_id)
        
        conversations_coll = get_conversations_collection()
        clean_updates = {}
        for key in ["title", "status", "language", "mode"]:
            if key in updates and updates[key] is not None:
                clean_updates[key] = updates[key]

        clean_updates["updated_at"] = get_utc_now_iso()

        await conversations_coll.update_one(
            {"$or": [{"_id": conversation_id}, {"id": conversation_id}]},
            {"$set": clean_updates}
        )
        return await self.get_conversation(conversation_id, user_id)

    async def delete_conversation(self, conversation_id: str, user_id: str) -> bool:
        # Ownership check
        await self.get_conversation(conversation_id, user_id)
        
        conversations_coll = get_conversations_collection()
        messages_coll = get_messages_collection()

        # Delete conversation
        await conversations_coll.delete_one({"$or": [{"_id": conversation_id}, {"id": conversation_id}]})
        
        # Cascading delete: permanently purge all associated messages (FR-016 compliant)
        await messages_coll.delete_many({
            "$or": [{"conversation_id": conversation_id}, {"session_id": conversation_id}]
        })
        return True

conversation_service = ConversationService()

