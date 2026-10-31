import re
from typing import Dict, Any, List

INTENT_PATTERNS = {
    "emergency": {
        "keywords": ["emergency", "doctor", "urgent", "cant breathe", "can't breathe", "choking", "fallen", "fall", "help now"],
        "explanation": "Urgent assistance or emergency health intervention requested.",
        "confidence": 0.98,
        "templates": {
            "en": ["I need urgent assistance immediately.", "Please call a doctor.", "I am having difficulty and need help right now."],
            "hi": ["मुझे तुरंत मदद की ज़रूरत है।", "कृपया डॉक्टर को बुलाएं।", "मुझे तुरंत सहायता चाहिए।"],
            "hi-en": ["Mujhe urgently help chahiye.", "Please doctor ko bulao.", "Emergency hai, please help."],
        }
    },
    "pain_discomfort": {
        "keywords": ["pain", "hurt", "hurts", "ache", "durd", "dard", "headache", "stomach", "uncomfortable", "dizzy", "tired"],
        "explanation": "Expression of physical discomfort, fatigue, or localized pain.",
        "confidence": 0.94,
        "templates": {
            "en": ["I am experiencing some pain.", "I feel uncomfortable and need to adjust.", "I am feeling quite tired right now."],
            "hi": ["मुझे दर्द हो रहा है।", "मैं असहज महसूस कर रहा हूँ।", "मुझे थकान महसूस हो रही है।"],
            "hi-en": ["Mujhe dard ho raha hai.", "Main comfortable nahi feel kar raha.", "Mujhe thakan lag rahi hai."],
        }
    },
    "request_need": {
        "keywords": ["water", "drink", "thirsty", "food", "eat", "hungry", "bathroom", "toilet", "washroom", "medicine", "pill", "blanket", "cold", "hot", "fan", "glasses"],
        "explanation": "Direct physical request for hydration, nourishment, personal care, or comfort.",
        "confidence": 0.93,
        "templates": {
            "en": ["I would like some water, please.", "Can I please have a glass of water?", "I need some assistance with personal care."],
            "hi": ["कृपया मुझे थोड़ा पानी दे दीजिए।", "क्या मुझे एक गिलास पानी मिल सकता है?", "मुझे थोड़ी सहायता की आवश्यकता है।"],
            "hi-en": ["Please mujhe thoda paani de dijiye.", "Kya mujhe paani mil sakta hai?", "Mujhe help chahiye."],
        }
    },
    "affirmation": {
        "keywords": ["yes", "yeah", "yep", "agree", "sure", "ok", "okay", "fine", "correct", "true", "haan", "ha", "theek", "bilkul"],
        "explanation": "Affirmative agreement or consent to conversation partner's query.",
        "confidence": 0.95,
        "templates": {
            "en": ["Yes, I agree with that.", "Yes, that sounds good to me.", "Certainly, thank you."],
            "hi": ["हाँ, मैं सहमत हूँ।", "हाँ, यह ठीक रहेगा।", "जी बिल्कुल, धन्यवाद।"],
            "hi-en": ["Haan, I agree completely.", "Haan, that sounds good.", "Bilkul, thank you."],
        }
    },
    "negation": {
        "keywords": ["no", "nope", "nah", "dont", "don't", "disagree", "not now", "later", "nahi", "na", "mat"],
        "explanation": "Polite disagreement, refusal, or desire to postpone.",
        "confidence": 0.95,
        "templates": {
            "en": ["No thank you, not right now.", "I disagree with that, but thank you.", "No, I am alright."],
            "hi": ["नहीं धन्यवाद, अभी नहीं।", "मैं इससे सहमत नहीं हूँ।", "नहीं, मैं ठीक हूँ।"],
            "hi-en": ["Nahi thank you, abhi nahi.", "Main agree nahi karta.", "Nahi, I am fine."],
        }
    },
    "greeting": {
        "keywords": ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "namaste", "pranam"],
        "explanation": "Warm interpersonal greeting and opening connection.",
        "confidence": 0.92,
        "templates": {
            "en": ["Hello! How are you doing today?", "Good morning, glad to see you.", "Hello, nice to connect with you."],
            "hi": ["नमस्ते! आप कैसे हैं?", "सुप्रभात, आपसे मिलकर अच्छा लगा।", "नमस्ते, सब ठीक है?"],
            "hi-en": ["Hello! Aap kaise hain?", "Good morning, nice to see you.", "Namaste, kaise chal raha hai?"],
        }
    },
    "gratitude": {
        "keywords": ["thank", "thanks", "appreciate", "grateful", "shukriya", "dhanyawad", "dhanyavaad"],
        "explanation": "Appreciation and courteous acknowledgment.",
        "confidence": 0.96,
        "templates": {
            "en": ["Thank you very much for your help.", "I really appreciate your assistance.", "Thank you, that is very kind of you."],
            "hi": ["आपकी मदद के लिए बहुत-बहुत धन्यवाद।", "मैं आपके सहयोग की सराहना करता हूँ।", "धन्यवाद, यह बहुत अच्छा है।"],
            "hi-en": ["Thank you so much aapki help ke liye.", "Aapka bahut shukriya.", "Thanks a lot!"],
        }
    },
    "clarification": {
        "keywords": ["repeat", "again", "what", "pardon", "didn't catch", "didnt hear", "hear", "slowly", "samajh"],
        "explanation": "Request for communication partner to repeat or speak more slowly.",
        "confidence": 0.91,
        "templates": {
            "en": ["Could you please repeat that?", "Could you speak a little slower, please?", "Please give me a moment to process that."],
            "hi": ["क्या आप कृपया इसे दोहरा सकते हैं?", "कृपया थोड़ा धीरे बोलेंगे?", "कृपया मुझे समझने के लिए थोड़ा समय दें।"],
            "hi-en": ["Kya aap please repeat kar sakte hain?", "Thoda slowly bolenge please?", "Give me a moment to process."],
        }
    },
}

class IntentService:
    """Independent intent classification service for assistive conversation."""

    def classify_intent(self, text: str, language: str = "en") -> Dict[str, Any]:
        clean = (text or "").strip().lower()
        if not clean:
            return {
                "intent": "general_statement",
                "confidence": 0.60,
                "explanation": "Neutral conversation message without dominant keyword patterns.",
                "keywords": [],
                "suggested_templates": ["Please give me a moment to respond.", "I am thinking about what you said."]
            }

        lang_key = "hi" if language == "hi" else ("hi-en" if language in {"hi-en", "hinglish"} else "en")

        # Specific need matches (e.g. water -> specific expansion)
        if "water" in clean or "paani" in clean or "pani" in clean or "जल" in clean or "पानी" in clean:
            return {
                "intent": "request_need",
                "confidence": 0.96,
                "explanation": "User is expressing a physical need for hydration.",
                "keywords": ["water"],
                "suggested_templates": [
                    "I would like some water, please." if lang_key == "en" else "कृपया मुझे थोड़ा पानी दे दीजिए।",
                    "Can I please have a glass of water?" if lang_key == "en" else "क्या मुझे एक गिलास पानी मिल सकता है?",
                    "Water, please." if lang_key == "en" else "पानी, कृपया।",
                ]
            }

        # Scan registered intent keyword patterns
        for intent_name, data in INTENT_PATTERNS.items():
            matched_keywords = [kw for kw in data["keywords"] if re.search(r"\b" + re.escape(kw) + r"\b", clean)]
            if matched_keywords:
                templates = data["templates"].get(lang_key, data["templates"]["en"])
                return {
                    "intent": intent_name,
                    "confidence": data["confidence"],
                    "explanation": data["explanation"],
                    "keywords": matched_keywords,
                    "suggested_templates": templates,
                }

        # Fallback general intent
        return {
            "intent": "general_statement",
            "confidence": 0.70,
            "explanation": "General communication phrase proposing conversational engagement.",
            "keywords": [],
            "suggested_templates": [
                f"I want to say: {text}" if lang_key == "en" else f"मैं कहना चाहता हूँ: {text}",
                "Could you give me a moment to finish my thought?",
                "Yes, let's talk about that.",
            ]
        }

intent_service = IntentService()
