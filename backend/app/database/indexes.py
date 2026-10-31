import logging
from backend.app.database.mongodb import (
    get_users_collection,
    get_conversations_collection,
    get_messages_collection,
    get_preferences_collection,
    get_phrases_collection,
    get_consents_collection,
)

logger = logging.getLogger("voice_expression.indexes")

async def create_database_indexes():
    """Create MongoDB indexes for performance, uniqueness, and relational consistency."""
    try:
        users = get_users_collection()
        await users.create_index([("email", 1)], unique=True)
        
        conversations = get_conversations_collection()
        await conversations.create_index([("user_id", 1)])
        await conversations.create_index([("updated_at", -1)])
        
        messages = get_messages_collection()
        await messages.create_index([("conversation_id", 1)])
        await messages.create_index([("user_id", 1)])
        await messages.create_index([("created_at", 1)])
        
        preferences = get_preferences_collection()
        await preferences.create_index([("user_id", 1)], unique=True)
        
        phrases = get_phrases_collection()
        await phrases.create_index([("user_id", 1)])
        await phrases.create_index([("category", 1)])

        consents = get_consents_collection()
        await consents.create_index([("user_id", 1)])

        logger.info("Successfully registered MongoDB database indexes for ai_manthan.")
    except Exception as e:
        logger.warning(f"Note on index creation: {e}")

