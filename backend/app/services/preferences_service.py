from typing import Dict, Any, Optional
from backend.app.database.mongodb import (
    get_preferences_collection,
    get_utc_now_iso,
)

DEFAULT_PREFS = {
    "preferred_language": "en",
    "preferred_voice": None,
    "speech_speed": 1.0,
    "volume": 1.0,
    "text_size": "large",
    "high_contrast": False,
    "reduced_motion": False,
    "voice_cloning_consent": True,
}

class PreferencesService:
    async def get_preferences(self, user_id: str) -> Dict[str, Any]:
        prefs_coll = get_preferences_collection()
        doc = await prefs_coll.find_one({"user_id": user_id})
        if not doc:
            doc = dict(DEFAULT_PREFS)
            doc["_id"] = "pref_" + user_id
            doc["user_id"] = user_id
            doc["updated_at"] = get_utc_now_iso()
            await prefs_coll.insert_one(doc)

        doc["id"] = str(doc.get("_id", "pref_" + user_id))
        return doc

    async def update_preferences(self, user_id: str, updates: Dict[str, Any]) -> Dict[str, Any]:
        prefs_coll = get_preferences_collection()
        now = get_utc_now_iso()

        clean = {}
        # Flat fields
        for field in ["preferred_language", "preferred_voice", "speech_speed", "volume", "text_size", "high_contrast", "reduced_motion", "voice_cloning_consent"]:
            if field in updates and updates[field] is not None:
                clean[field] = updates[field]

        # Nested frontend structures support:
        if "accessibility" in updates and isinstance(updates["accessibility"], dict):
            acc = updates["accessibility"]
            if "font_size" in acc: clean["text_size"] = acc["font_size"]
            if "high_contrast" in acc: clean["high_contrast"] = acc["high_contrast"]
            if "reduced_motion" in acc: clean["reduced_motion"] = acc["reduced_motion"]

        if "speech" in updates and isinstance(updates["speech"], dict):
            sp = updates["speech"]
            if "rate" in sp: clean["speech_speed"] = sp["rate"]
            if "volume" in sp: clean["volume"] = sp["volume"]
            if "voiceId" in sp: clean["preferred_voice"] = sp["voiceId"]

        clean["updated_at"] = now

        existing = await prefs_coll.find_one({"user_id": user_id})
        if existing:
            await prefs_coll.update_one({"user_id": user_id}, {"$set": clean})
        else:
            new_doc = dict(DEFAULT_PREFS)
            new_doc["_id"] = "pref_" + user_id
            new_doc["user_id"] = user_id
            new_doc.update(clean)
            await prefs_coll.insert_one(new_doc)

        return await self.get_preferences(user_id)

preferences_service = PreferencesService()

