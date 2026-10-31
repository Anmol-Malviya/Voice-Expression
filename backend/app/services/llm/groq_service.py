import uuid
import json
import logging
import httpx
from typing import List, Dict, Any, Optional
from fastapi import HTTPException, status

from backend.app.services.llm.base import BaseLLMService
from backend.app.services.llm.openai_service import OpenAIService
from backend.app.services.ai.intent_service import intent_service
from backend.app.core.config import settings

logger = logging.getLogger("voice_expression.groq")

class GroqService(BaseLLMService):
    """
    Ultra-low latency Conversational Intelligence Service powered by Groq.
    Uses OpenAI-compatible Chat Completions API with gpt-oss-120b or llama models.
    Enforces strict User Autonomy safeguards (proposals only, never auto-spoken).
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout_seconds: float = 12.0,
    ):
        self.api_key = api_key if api_key is not None else settings.GROQ_API_KEY
        chosen_model = model or settings.GROQ_MODEL or "openai/gpt-oss-120b"
        self.model = chosen_model
        self.timeout_seconds = timeout_seconds
        self.api_url = "https://api.groq.com/openai/v1/chat/completions"

    async def generate_response(
        self,
        user_message: str,
        conversation_context: Optional[List[Dict[str, Any]]] = None,
        preferred_language: str = "en",
    ) -> Dict[str, Any]:
        clean_text = (user_message or "").strip()
        if not self.api_key:
            fallback = OpenAIService(api_key=None)
            return fallback._generate_local_response_fallback(clean_text, conversation_context, preferred_language)

        intent_info = intent_service.classify_intent(clean_text, language=preferred_language)

        system_prompt = (
            "You are an assistive communication AI for VoiceExpression (AI Manthan 2.0 PS16). "
            "You assist an individual with speech impairments by proposing authentic, clear first-person replies. "
            "CONSTRAINTS:\n"
            "1. Output proposals only, never decisions. The user will review, edit, and confirm before speaking.\n"
            "2. Never alter the user's intended meaning.\n"
            "3. Never invent emotions, medical conclusions, or unsolicited opinions.\n"
            "4. Provide 1 primary suggested response and 2-3 concise alternative suggestions.\n"
            "5. Output valid JSON in this exact structure:\n"
            "{\n"
            '  "suggested_response": "Primary clear, polite first-person sentence",\n'
            '  "alternative_suggestions": ["Alternative sentence 1", "Alternative sentence 2"],\n'
            '  "intent_classification": "intent_category",\n'
            '  "confidence": 0.95,\n'
            '  "explanation": "Brief reason why these proposals fit user context",\n'
            '  "needs_clarification": false\n'
            "}"
        )

        messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]

        if conversation_context:
            for ctx_msg in conversation_context[-settings.AI_CONTEXT_WINDOW:]:
                role = "assistant" if ctx_msg.get("sender") == "user" else "user"
                content = ctx_msg.get("content") or ctx_msg.get("text") or ""
                if content:
                    messages.append({"role": role, "content": content})

        user_prompt = (
            f"Input text/draft: '{clean_text}'\n"
            f"Preferred language: {preferred_language}\n"
            f"Preliminary detected intent: {intent_info['intent']}"
        )
        messages.append({"role": "user", "content": user_prompt})

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.3,
            "response_format": {"type": "json_object"},
        }

        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout_seconds) as client:
                response = await client.post(self.api_url, json=payload, headers=headers)
                
                if response.status_code == 401:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Groq authentication failed. Please verify your GROQ_API_KEY."
                    )
                elif response.status_code == 429:
                    raise HTTPException(
                        status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                        detail="Groq rate limit exceeded. Please retry shortly."
                    )
                elif response.status_code >= 400:
                    raise HTTPException(
                        status_code=response.status_code if response.status_code < 500 else status.HTTP_502_BAD_GATEWAY,
                        detail=f"Groq service error: {response.text[:250]}"
                    )

                data = response.json()
                content = data["choices"][0]["message"]["content"]
                parsed = json.loads(content)

                suggested = parsed.get("suggested_response", clean_text)
                alternatives = parsed.get("alternative_suggestions", [])
                intent_cls = parsed.get("intent_classification", intent_info["intent"])
                confidence = float(parsed.get("confidence", 0.94))
                explanation = parsed.get("explanation", intent_info["explanation"])
                needs_clarification = bool(parsed.get("needs_clarification", False))

                candidates = [
                    {
                        "candidate_id": "cand_1",
                        "text": suggested,
                        "reason": explanation,
                        "confidence": confidence,
                    }
                ]
                for idx, alt in enumerate(alternatives, start=2):
                    candidates.append({
                        "candidate_id": f"cand_{idx}",
                        "text": alt,
                        "reason": f"Alternative phrasing {idx-1}",
                        "confidence": max(0.60, round(confidence - (0.05 * (idx - 1)), 2)),
                    })

                return {
                    "suggested_response": suggested,
                    "alternative_suggestions": alternatives,
                    "intent_classification": intent_cls,
                    "confidence": confidence,
                    "explanation": explanation,
                    "rationale": explanation,
                    "needs_clarification": needs_clarification,
                    "candidates": candidates,
                    "signals_used": ["groq_llm", "intent_classifier"],
                }

        except httpx.TimeoutException:
            raise HTTPException(
                status_code=status.HTTP_504_GATEWAY_TIMEOUT,
                detail=f"Groq request timed out after {self.timeout_seconds}s."
            )
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Network error communicating with Groq: {str(exc)}"
            )

    async def generate_suggestions(
        self,
        text: str,
        conversation_context: Optional[List[Dict[str, Any]]] = None,
        language: str = "en",
    ) -> Dict[str, Any]:
        res = await self.generate_response(
            user_message=text,
            conversation_context=conversation_context,
            preferred_language=language,
        )
        return {
            "original_text": text,
            "suggested_response": res["suggested_response"],
            "alternative_suggestions": res["alternative_suggestions"],
            "intent": res["intent_classification"],
            "confidence": res["confidence"],
            "candidates": res["candidates"],
            "explanation": res["explanation"],
        }

    async def generate_reply_candidates(
        self,
        partner_text: Optional[str],
        gesture: Optional[str],
        lip_active: bool,
        history: Optional[List[Dict[str, Any]]] = None,
        language: str = "en"
    ) -> Dict[str, Any]:
        prompt_parts = []
        if partner_text:
            prompt_parts.append(f"Conversation partner said: '{partner_text}'")
        if gesture and gesture != "none":
            prompt_parts.append(f"Observed physical gesture: {gesture}")
        if lip_active:
            prompt_parts.append("Lip movement detected (attempting to speak)")

        combined_input = ". ".join(prompt_parts) if prompt_parts else "General greeting"
        res = await self.generate_response(
            user_message=combined_input,
            conversation_context=history,
            preferred_language=language,
        )

        signals_used = []
        if partner_text:
            signals_used.append("transcript")
        if gesture and gesture != "none":
            signals_used.append("hand_landmarks")
        if lip_active:
            signals_used.append("lip_motion")
        if not signals_used:
            signals_used.append("groq_llm")

        return {
            "inference_id": f"inf_{uuid.uuid4().hex[:8]}",
            "candidates": res["candidates"],
            "needs_clarification": res.get("needs_clarification", False),
            "signals_used": signals_used,
            "suggested_response": res["suggested_response"],
            "alternative_suggestions": res["alternative_suggestions"],
            "intent_classification": res["intent_classification"],
            "confidence": res["confidence"],
            "explanation": res["explanation"],
        }

