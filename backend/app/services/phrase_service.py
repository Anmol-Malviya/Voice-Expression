from typing import List, Dict, Any, Optional
import uuid
from fastapi import HTTPException, status
from backend.app.database.mongodb import (
    get_phrases_collection,
    get_utc_now_iso,
)

DEFAULT_SYSTEM_PHRASES = [
    {"id": "qp_basic_1", "phrase": "Yes.", "category": "Basic", "language": "en"},
    {"id": "qp_basic_2", "phrase": "No.", "category": "Basic", "language": "en"},
    {"id": "qp_basic_3", "phrase": "Please wait.", "category": "Basic", "language": "en"},
    {"id": "qp_basic_4", "phrase": "Thank you.", "category": "Basic", "language": "en"},
    {"id": "qp_needs_1", "phrase": "I want water.", "category": "Needs", "language": "en"},
    {"id": "qp_needs_1b", "phrase": "I need water.", "category": "Needs", "language": "en"},
    {"id": "qp_needs_2", "phrase": "I need some rest.", "category": "Needs", "language": "en"},
    {"id": "qp_needs_3", "phrase": "I want to go outside.", "category": "Needs", "language": "en"},
    {"id": "qp_emerg_1", "phrase": "I need help.", "category": "Emergency", "language": "en"},
    {"id": "qp_emerg_2", "phrase": "I am not feeling well.", "category": "Emergency", "language": "en"},
    {"id": "qp_feel_1", "phrase": "I am comfortable.", "category": "Feelings", "language": "en"},
    {"id": "qp_soc_1", "phrase": "Hello, good to see you.", "category": "Social", "language": "en"},
    {"id": "qp_soc_2", "phrase": "Please repeat that.", "category": "Social", "language": "en"},
]

class PhraseService:
    async def get_phrases(self, user_id: str, category: Optional[str] = None) -> List[Dict[str, Any]]:
        phrases_coll = get_phrases_collection()
        query: Dict[str, Any] = {"user_id": user_id}
        if category:
            query["category"] = category

        cursor = phrases_coll.find(query)
        user_phrases = await cursor.to_list()

        # Format system defaults
        system_phrases = []
        for p in DEFAULT_SYSTEM_PHRASES:
            if not category or p["category"].lower() == category.lower():
                system_phrases.append({
                    "_id": p["id"],
                    "id": p["id"],
                    "user_id": None,
                    "phrase": p["phrase"],
                    "text": p["phrase"],
                    "category": p["category"],
                    "language": p["language"],
                    "created_at": "2026-10-31T00:00:00Z",
                })

        for p in user_phrases:
            p["id"] = str(p.get("_id", p.get("id")))
            p["text"] = p.get("phrase", p.get("text", ""))

        return system_phrases + user_phrases

    async def create_phrase(
        self,
        user_id: str,
        phrase: str,
        category: str = "Basic",
        language: str = "en",
    ) -> Dict[str, Any]:
        if not phrase or not phrase.strip():
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Phrase text cannot be empty.")

        phrases_coll = get_phrases_collection()
        phrase_id = "qp_" + uuid.uuid4().hex[:12]
        now = get_utc_now_iso()

        doc = {
            "_id": phrase_id,
            "id": phrase_id,
            "user_id": user_id,
            "phrase": phrase.strip(),
            "text": phrase.strip(),
            "category": category,
            "language": language,
            "created_at": now,
        }
        await phrases_coll.insert_one(doc)
        return doc

    async def update_phrase(
        self,
        phrase_id: str,
        user_id: str,
        updates: Dict[str, Any],
    ) -> Dict[str, Any]:
        phrases_coll = get_phrases_collection()
        existing = await phrases_coll.find_one({
            "$or": [{"_id": phrase_id}, {"id": phrase_id}]
        })
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quick phrase not found.")
        
        if existing.get("user_id") != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot modify global system phrase.")

        clean = {}
        if "phrase" in updates and updates["phrase"]:
            clean["phrase"] = updates["phrase"].strip()
            clean["text"] = clean["phrase"]
        elif "text" in updates and updates["text"]:
            clean["phrase"] = updates["text"].strip()
            clean["text"] = clean["phrase"]

        if "category" in updates and updates["category"]:
            clean["category"] = updates["category"]
        if "language" in updates and updates["language"]:
            clean["language"] = updates["language"]

        await phrases_coll.update_one(
            {"$or": [{"_id": phrase_id}, {"id": phrase_id}]},
            {"$set": clean}
        )
        updated = await phrases_coll.find_one({"$or": [{"_id": phrase_id}, {"id": phrase_id}]})
        updated["id"] = str(updated.get("_id", phrase_id))
        return updated

    async def delete_phrase(self, phrase_id: str, user_id: str) -> bool:
        phrases_coll = get_phrases_collection()
        existing = await phrases_coll.find_one({
            "$or": [{"_id": phrase_id}, {"id": phrase_id}]
        })
        if not existing:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Quick phrase not found.")

        if existing.get("user_id") != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Cannot delete default system phrase.")

        await phrases_coll.delete_one({"$or": [{"_id": phrase_id}, {"id": phrase_id}]})
        return True

phrase_service = PhraseService()
