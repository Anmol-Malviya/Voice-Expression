# Database Schema Specification

## Target Engine: MongoDB Atlas
Database name: `ai_manthan` (or `ps16_assistive_ai`)

### 1. `users` Collection
```json
{
  "_id": "ObjectId",
  "name": "Alex Mercer",
  "email": "alex@example.com",
  "password_hash": "$2b$12$...",
  "preferred_language": "en",
  "accessibility_settings": {
    "font_size": "large",
    "high_contrast": false,
    "theme": "light",
    "reduced_motion": false
  },
  "created_at": "2026-10-31T08:30:00Z",
  "updated_at": "2026-10-31T08:30:00Z"
}
```

### 2. `sessions` (Conversations) Collection
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "title": "Family Dinner Conversation",
  "status": "active",
  "language": "hi-en",
  "started_at": "2026-10-31T08:30:00Z",
  "ended_at": null,
  "created_at": "2026-10-31T08:30:00Z",
  "updated_at": "2026-10-31T08:30:00Z"
}
```

### 3. `messages` (Conversation Events) Collection
```json
{
  "_id": "ObjectId",
  "conversation_id": "ObjectId",
  "sender": "partner", // "partner" or "user"
  "message_type": "transcript", // "transcript", "quick_phrase", "ai_confirmed", "manual_typed"
  "content": "Would you like some water?",
  "audio_url": null,
  "metadata": {
    "confidence": 0.95,
    "start_ms": 0,
    "end_ms": 1450,
    "gestures_fused": ["open_palm"]
  },
  "created_at": "2026-10-31T08:30:05Z"
}
```

### 4. `user_preferences` Collection
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "preferred_voice": "21m00Tcm4TlvDq8ikWAM",
  "speech_rate": 1.0,
  "volume": 1.0,
  "quick_phrases": [
    {"id": "p1", "category": "Emergency", "text": "I need help."},
    {"id": "p2", "category": "General", "text": "Please wait."},
    {"id": "p3", "category": "General", "text": "I need water."},
    {"id": "p4", "category": "Medical", "text": "I am not feeling well."},
    {"id": "p5", "category": "Social", "text": "Thank you."},
    {"id": "p6", "category": "Social", "text": "Please repeat."},
    {"id": "p7", "category": "Social", "text": "Yes."},
    {"id": "p8", "category": "Social", "text": "No."},
    {"id": "p9", "category": "General", "text": "I want to go home."}
  ],
  "theme": "light",
  "font_size": "large"
}
```

### 5. `voice_consents` Collection
```json
{
  "_id": "ObjectId",
  "user_id": "ObjectId",
  "voice_ref": "custom_voice_id",
  "purpose": "Speak user-confirmed conversation replies",
  "scope": "voice_cloning_and_generation",
  "consent_version": "v1.0",
  "status": "active", // "active", "revoked"
  "granted_at": "2026-10-31T08:30:00Z",
  "revoked_at": null
}
```

### 6. `evaluations` Collection
```json
{
  "_id": "ObjectId",
  "scenario_id": "water_request_01",
  "mode": "audio_plus_visual",
  "wer": 0.08,
  "intent_top1": 1.0,
  "latency_ms": 1420,
  "created_at": "2026-10-31T08:35:00Z"
}
```

