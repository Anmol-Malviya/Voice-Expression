# Database Schema: MongoDB Atlas (`ai_manthan`)

The VoiceExpression backend utilizes MongoDB Atlas database `ai_manthan` with optimized indexes, strict ownership constraints, and zero raw media retention.

---

## 1. Collections & Document Structures

### `users`
Stores user authentication credentials, profiles, and initial accessibility presets.

| Field | Type | Description |
|---|---|---|
| `_id` | String / ObjectId | Primary key (e.g. `usr_...`) |
| `name` | String | User's full name |
| `email` | String (Unique) | Normalized email address |
| `password_hash` | String | Bcrypt hash |
| `preferred_language` | String | Language code (e.g. `en`, `hi`, `es`) |
| `accessibility_settings` | Object | `{ font_size, high_contrast, theme, reduced_motion }` |
| `voice_consent` | Boolean | True if voice cloning consent is active |
| `created_at` | String (ISO UTC) | Timestamp |
| `updated_at` | String (ISO UTC) | Timestamp |

**Indexes**:
- `{"email": 1}` (Unique index)

---

### `conversations`
Maintains assistive dialogue sessions and life-cycle metadata.

| Field | Type | Description |
|---|---|---|
| `_id` | String / ObjectId | Conversation ID (e.g. `sess_...`) |
| `user_id` | String | Foreign key to `users._id` |
| `title` | String | Session title |
| `language` | String | Session language |
| `mode` | String | `live_conversation`, `gesture_guided`, `emergency` |
| `status` | String | `active`, `ended`, `archived` |
| `messages_count` | Integer | Total messages in conversation |
| `last_message_preview` | String | Truncated snippet of last message |
| `created_at` | String (ISO UTC) | Timestamp |
| `updated_at` | String (ISO UTC) | Timestamp |

**Indexes**:
- `{"user_id": 1}`
- `{"updated_at": -1}`

---

### `messages`
Stores text transcripts, AI-ranked candidate proposals, and fused gesture signals.

| Field | Type | Description |
|---|---|---|
| `_id` | String / ObjectId | Message ID (e.g. `msg_...`) |
| `conversation_id` | String | Foreign key to `conversations._id` |
| `user_id` | String | Foreign key to `users._id` |
| `sender` | String | `user`, `partner`, `system` |
| `message_type` | String | `text`, `speech_transcription`, `ai_suggestion`, `gesture_generated`, `speech_output` |
| `text` | String | Spoken or transcribed message text |
| `audio_url` | String (Optional) | Ephemeral synthesis audio reference |
| `metadata` | Object | Fused signals, candidate confidence scores |
| `created_at` | String (ISO UTC) | Timestamp |

**Indexes**:
- `{"conversation_id": 1}`
- `{"user_id": 1}`
- `{"created_at": 1}`

---

### `user_preferences`
Contains tactile and sensory assistive settings.

| Field | Type | Description |
|---|---|---|
| `_id` | String | Primary key (`pref_<user_id>`) |
| `user_id` | String (Unique) | Foreign key to `users._id` |
| `preferred_voice` | String | Voice model ID or local identifier |
| `speech_speed` | Float | Speech rate multiplier ($0.5$ to $2.0$) |
| `volume` | Float | Volume level ($0.0$ to $1.0$) |
| `text_size` | String | `normal`, `large`, `xlarge` |
| `high_contrast` | Boolean | True for WCAG AAA yellow-on-black |
| `reduced_motion` | Boolean | True to disable CSS animations |
| `preferred_language` | String | Spoken dialect code |
| `voice_cloning_consent`| Boolean | True if informed consent recorded |
| `updated_at` | String (ISO UTC) | Timestamp |

**Indexes**:
- `{"user_id": 1}` (Unique index)

---

### `quick_phrases`
Library of 1-tap emergency, social, and routine AAC communication tiles.

| Field | Type | Description |
|---|---|---|
| `_id` | String | Primary key (`qp_...`) |
| `user_id` | String (Optional) | User ID (null for system defaults) |
| `phrase` | String | Phrase sentence |
| `category` | String | `Basic`, `Needs`, `Emergency`, `Feelings`, `Social`, `Personal` |
| `language` | String | Language code |
| `created_at` | String (ISO UTC) | Timestamp |

**Indexes**:
- `{"user_id": 1}`
- `{"category": 1}`

