import uuid
import logging
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional

from backend.app.core.config import settings
from backend.app.services.message_service import message_service
from backend.app.services.llm.base import BaseLLMService
from backend.app.services.llm.openai_service import OpenAIService
from backend.app.services.ai.intent_service import intent_service

logger = logging.getLogger("voice_expression.ai_engine")

class ConversationEngine:
    """
    Core AI Conversation Engine for VoiceExpression.
    Manages bounded conversation memory retrieval, provider dispatching (OpenAI/fallback),
    and enforces strict User Autonomy safeguards (proposals only, never auto-spoken).
    """

    def __init__(self, llm_service: Optional[BaseLLMService] = None):
        self._llm_service = llm_service

    def get_llm_service(self) -> BaseLLMService:
        if self._llm_service:
            return self._llm_service
        # Provider selection: OpenAI if configured, otherwise fallback to local/Gemini
        return OpenAIService()

    async def get_bounded_context(
        self,
        conversation_id: str,
        user_id: Optional[str] = None,
        limit: Optional[int] = None,
    ) -> List[Dict[str, Any]]:
        """
        Retrieve recent messages from MongoDB, bounded to avoid excessive context or token bloat.
        Sanitizes data to prevent leaking sensitive information or raw media to the LLM.
        """
        if not conversation_id or conversation_id in {"active_session", "demo", "anonymous"}:
            return []

        effective_limit = limit or settings.AI_CONTEXT_WINDOW
        try:
            from backend.app.database.mongodb import get_messages_collection
            coll = get_messages_collection()
            cursor = coll.find({
                "$or": [{"conversation_id": conversation_id}, {"session_id": conversation_id}]
            }).sort("created_at", -1).limit(effective_limit)
            raw_messages = await cursor.to_list()
            # Reverse to chronological order for the LLM
            raw_messages.reverse()
        except Exception as e:
            logger.warning(f"Could not load conversation context for {conversation_id}: {e}")
            return []

        # Sanitize messages: retain only role, content, and safe timestamp
        sanitized: List[Dict[str, Any]] = []
        for msg in raw_messages:
            content = msg.get("content") or msg.get("text") or ""
            if not content.strip():
                continue
            sanitized.append({
                "sender": msg.get("sender", "user"),
                "content": content.strip()[:300],  # Bound length per message
                "timestamp": msg.get("timestamp", ""),
            })

        return sanitized[-effective_limit:]

    async def respond(
        self,
        user_message: str,
        conversation_id: Optional[str] = None,
        conversation_context: Optional[List[Dict[str, Any]]] = None,
        preferred_language: str = "en",
        user_id: Optional[str] = None,
        gesture: Optional[str] = None,
        lip_active: bool = False,
    ) -> Dict[str, Any]:
        """
        Generate conversational suggestions with intent classification and alternatives.
        Strictly returns proposals: is_proposal=True, requires_confirmation=True.
        """
        clean_text = (user_message or "").strip()

        # Build bounded context from database if not explicitly passed
        context = conversation_context
        if context is None and conversation_id:
            context = await self.get_bounded_context(conversation_id, user_id=user_id)

        llm = self.get_llm_service()

        # If gesture or multimodal signals are present, use reply candidate generator
        if gesture and gesture != "none":
            result = await llm.generate_reply_candidates(
                partner_text=clean_text,
                gesture=gesture,
                lip_active=lip_active,
                history=context,
                language=preferred_language,
            )
            suggested = result.get("suggested_response") or (result["candidates"][0]["text"] if result.get("candidates") else clean_text)
            alternatives = result.get("alternative_suggestions") or [c["text"] for c in result.get("candidates", [])[1:]]
            intent_cls = result.get("intent_classification", "multimodal_gesture")
            confidence = float(result.get("confidence", 0.92))
            explanation = result.get("explanation") or result["candidates"][0].get("reason", "Multimodal candidate response")
            candidates = result.get("candidates", [])
            signals = result.get("signals_used", ["hand_landmarks"])
            needs_clarification = result.get("needs_clarification", False)
        else:
            result = await llm.generate_response(
                user_message=clean_text,
                conversation_context=context,
                preferred_language=preferred_language,
            )
            suggested = result["suggested_response"]
            alternatives = result["alternative_suggestions"]
            intent_cls = result["intent_classification"]
            confidence = float(result["confidence"])
            explanation = result.get("explanation") or result.get("rationale")
            candidates = result.get("candidates", [])
            signals = result.get("signals_used", ["openai_llm"])
            needs_clarification = result.get("needs_clarification", False)

        inference_id = f"inf_{uuid.uuid4().hex[:8]}"

        return {
            "inference_id": inference_id,
            "suggested_response": suggested,
            "alternative_suggestions": alternatives,
            "intent_classification": intent_cls,
            "confidence": confidence,
            "explanation": explanation,
            "rationale": explanation,
            "is_proposal": True,
            "requires_confirmation": True,
            "candidates": candidates,
            "needs_clarification": needs_clarification,
            "signals_used": signals,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

    async def suggest_alternatives(
        self,
        text: str,
        conversation_id: Optional[str] = None,
        language: str = "en",
        user_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Generate alternative message suggestions based on user draft or shorthand (e.g. 'I water').
        Preserves user intent while expanding into clear, natural, assistive sentences.
        """
        clean_text = (text or "").strip()
        context = []
        if conversation_id:
            context = await self.get_bounded_context(conversation_id, user_id=user_id)

        llm = self.get_llm_service()
        raw_res = await llm.generate_suggestions(clean_text, conversation_context=context, language=language)

        inference_id = f"sug_{uuid.uuid4().hex[:8]}"
        return {
            "inference_id": inference_id,
            "original_text": clean_text,
            "suggested_response": raw_res["suggested_response"],
            "alternative_suggestions": raw_res["alternative_suggestions"],
            "intent": raw_res.get("intent", "assistive_suggestion"),
            "confidence": raw_res.get("confidence", 0.92),
            "candidates": raw_res.get("candidates", []),
            "explanation": raw_res.get("explanation", "Alternative phrasing options"),
            "is_proposal": True,
            "requires_confirmation": True,
        }

conversation_engine = ConversationEngine()
