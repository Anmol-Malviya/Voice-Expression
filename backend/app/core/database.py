import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import uuid
from backend.app.core.config import settings

logger = logging.getLogger("voice_expression.database")

class InMemoryCollection:
    """Async MongoDB Collection emulator for offline local testing and zero-dependency startup."""
    def __init__(self, name: str):
        self.name = name
        self.documents: Dict[str, Dict[str, Any]] = {}

    def _matches(self, doc: Dict[str, Any], query: Dict[str, Any]) -> bool:
        for k, v in query.items():
            if k not in doc:
                return False
            if isinstance(v, dict):
                # Simple operator support
                if "$in" in v and doc[k] not in v["$in"]:
                    return False
                if "$ne" in v and doc[k] == v["$ne"]:
                    return False
            elif doc[k] != v:
                return False
        return True

    async def insert_one(self, doc: Dict[str, Any]):
        doc_copy = dict(doc)
        if "_id" not in doc_copy:
            doc_copy["_id"] = str(uuid.uuid4())
        self.documents[str(doc_copy["_id"])] = doc_copy
        class InsertResult:
            inserted_id = doc_copy["_id"]
        return InsertResult()

    async def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for doc in self.documents.values():
            if self._matches(doc, query):
                return dict(doc)
        return None

    def find(self, query: Optional[Dict[str, Any]] = None):
        query = query or {}
        matched = [dict(doc) for doc in self.documents.values() if self._matches(doc, query)]
        
        class Cursor:
            def __init__(self, items):
                self.items = items
            def sort(self, key, direction=1):
                self.items.sort(key=lambda x: x.get(key, ""), reverse=(direction == -1))
                return self
            def limit(self, count):
                self.items = self.items[:count]
                return self
            async def to_list(self, length=None):
                return self.items[:length] if length else self.items
            def __aiter__(self):
                self._iter = iter(self.items)
                return self
            async def __anext__(self):
                try:
                    return next(self._iter)
                except StopIteration:
                    raise StopAsyncIteration
        return Cursor(matched)

    async def update_one(self, query: Dict[str, Any], update: Dict[str, Any]):
        for doc_id, doc in self.documents.items():
            if self._matches(doc, query):
                if "$set" in update:
                    doc.update(update["$set"])
                class UpdateResult:
                    matched_count = 1
                    modified_count = 1
                return UpdateResult()
        class EmptyUpdateResult:
            matched_count = 0
            modified_count = 0
        return EmptyUpdateResult()

    async def delete_one(self, query: Dict[str, Any]):
        for doc_id, doc in list(self.documents.items()):
            if self._matches(doc, query):
                del self.documents[doc_id]
                class DeleteResult:
                    deleted_count = 1
                return DeleteResult()
        class EmptyDeleteResult:
            deleted_count = 0
        return EmptyDeleteResult()

    async def delete_many(self, query: Dict[str, Any]):
        count = 0
        for doc_id, doc in list(self.documents.items()):
            if self._matches(doc, query):
                del self.documents[doc_id]
                count += 1
        class DeleteResult:
            deleted_count = count
        return DeleteResult()

    async def count_documents(self, query: Dict[str, Any]) -> int:
        return sum(1 for doc in self.documents.values() if self._matches(doc, query))

class Database:
    def __init__(self):
        self.is_atlas_connected = False
        self.client = None
        self.db = None
        self._mock_collections = {}

    async def connect(self):
        if settings.MONGODB_URI:
            try:
                from motor.motor_asyncio import AsyncIOMotorClient
                self.client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=3000)
                await self.client.admin.command('ping')
                self.db = self.client[settings.MONGODB_DATABASE]
                self.is_atlas_connected = True
                logger.info(f"Connected to MongoDB Atlas: {settings.MONGODB_DATABASE}")
                return
            except Exception as e:
                logger.warning(f"MongoDB Atlas connection failed: {e}. Falling back to in-memory database.")
        
        self.is_atlas_connected = False
        logger.info("Using local async memory database engine (Full CRUD ready).")

    def get_collection(self, name: str):
        if self.is_atlas_connected and self.db is not None:
            return self.db[name]
        if name not in self._mock_collections:
            self._mock_collections[name] = InMemoryCollection(name)
        return self._mock_collections[name]

db_manager = Database()

# Helper accessors
def get_users_collection():
    return db_manager.get_collection("users")

def get_conversations_collection():
    return db_manager.get_collection("conversations")

def get_messages_collection():
    return db_manager.get_collection("messages")

def get_preferences_collection():
    return db_manager.get_collection("user_preferences")

def get_phrases_collection():
    return db_manager.get_collection("quick_phrases")

def get_consents_collection():
    return db_manager.get_collection("voice_consents")

def get_speech_history_collection():
    return db_manager.get_collection("speech_history")

def get_gesture_history_collection():
    return db_manager.get_collection("gesture_history")

def get_feedback_collection():
    return db_manager.get_collection("feedback")

def get_evaluations_collection():
    return db_manager.get_collection("evaluations")

