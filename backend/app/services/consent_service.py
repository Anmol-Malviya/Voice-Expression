import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from backend.app.core.database import get_consents_collection

class ConsentService:
    async def grant_consent(self, user_id: str, voice_id: str, purpose: str, scope: str) -> Dict[str, Any]:
        consents = get_consents_collection()
        consent_id = f"vc_{uuid.uuid4().hex[:8]}"
        doc = {
            "_id": consent_id,
            "user_id": user_id,
            "voice_ref": voice_id,
            "purpose": purpose,
            "scope": scope,
            "status": "active",
            "granted_at": datetime.utcnow().isoformat(),
            "revoked_at": None,
        }
        await consents.insert_one(doc)
        return doc

    async def revoke_consent(self, user_id: str, consent_id: str) -> bool:
        consents = get_consents_collection()
        res = await consents.update_one(
            {"_id": consent_id, "user_id": user_id},
            {"$set": {"status": "revoked", "revoked_at": datetime.utcnow().isoformat()}}
        )
        return res.modified_count > 0

    async def is_voice_permitted(self, user_id: str, voice_id: str) -> bool:
        # Standard voices are always permitted without cloning consent
        if voice_id in ["standard", "default", "21m00Tcm4TlvDq8ikWAM"]:
            return True
        consents = get_consents_collection()
        doc = await consents.find_one({"user_id": user_id, "voice_ref": voice_id, "status": "active"})
        return doc is not None

consent_service = ConsentService()

