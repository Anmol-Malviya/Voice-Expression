"""
Core database re-exports for backward compatibility.
Points to backend.app.database.mongodb
"""
from backend.app.database.mongodb import (
    db_manager,
    InMemoryCollection,
    get_utc_now_iso,
    get_users_collection,
    get_conversations_collection,
    get_messages_collection,
    get_preferences_collection,
    get_phrases_collection,
    get_consents_collection,
    get_speech_history_collection,
    get_gesture_history_collection,
    get_feedback_collection,
    get_evaluations_collection,
)
