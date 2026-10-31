# REST & WebSocket API Specification

Base URL: `/api/v1`

## 1. Authentication & Profile
- `POST /api/v1/auth/register`: Create user account. Returns `{ access_token, token_type, user }`.
- `POST /api/v1/auth/login`: Authenticate email/password. Returns `{ access_token, token_type, user }`.
- `GET /api/v1/auth/me`: Get authenticated user profile.
- `PUT /api/v1/auth/me`: Update user profile details.

## 2. Sessions (Conversations)
- `POST /api/v1/sessions`: Create new session with language and accessibility parameters.
- `GET /api/v1/sessions`: List user sessions.
- `GET /api/v1/sessions/{session_id}`: Retrieve session metadata and message history.
- `PATCH /api/v1/sessions/{session_id}`: Update session properties.
- `POST /api/v1/sessions/{session_id}/end`: Conclude session.
- `DELETE /api/v1/sessions/{session_id}`: Permanently delete conversation data.

## 3. Messages & Communication
- `POST /api/v1/messages`: Save a message (partner transcript, typed message, confirmed reply).
- `GET /api/v1/messages/{session_id}`: Fetch ordered messages.
- `DELETE /api/v1/messages/{message_id}`: Delete specific message.

## 4. Speech Services
- `POST /api/v1/speech/tts`: Synthesize speech audio. Returns audio binary or fallback speech metadata.
- `POST /api/v1/speech/stt`: Batch speech transcription with diarization / timing metadata.
- `POST /api/v1/transcriptions`: File upload audio transcription endpoint.
- `GET /api/v1/voices`: List available voices (ElevenLabs voices + standard system voices).
- `POST /api/v1/voice-consents`: Grant consent for voice clone usage.
- `DELETE /api/v1/voice-consents/{consent_id}`: Revoke voice cloning consent immediately.

## 5. AI Assistant & Multimodal Inference
- `POST /api/v1/visual-features`: Ingest client-side extracted landmarks & gesture descriptors.
- `POST /api/v1/inference`: Trigger multimodal fusion + LLM candidate reply generation.
- `POST /api/v1/sessions/{session_id}/confirmations`: Explicitly confirm/edit/reject reply candidate.
- `POST /api/v1/ai/respond`: Context-aware assistant query endpoint.
- `POST /api/v1/ai/suggestions`: Generate quick reply suggestions from incoming text.

## 6. Preferences & Quick Phrases
- `GET /api/v1/preferences`: Fetch user preferences (voice, rate, pitch, quick phrases, theme, font size).
- `PUT /api/v1/preferences`: Update preferences.
- `GET /api/v1/quick-phrases`: Fetch custom quick phrases.
- `POST /api/v1/quick-phrases`: Add quick phrase.
- `DELETE /api/v1/quick-phrases/{phrase_id}`: Remove quick phrase.

## 7. Evaluations & Health
- `POST /api/v1/evaluations/events`: Record latency and intent benchmark measurements.
- `GET /api/v1/evaluations/metrics`: Retrieve aggregated performance stats (WER, latency p50/p95).
- `GET /api/v1/health`: Liveness and dependency status check.

## 8. WebSocket Live Event Contract
URL: `ws://localhost:8000/ws/sessions/{session_id}?token={jwt_token}`

### Events:
- `subscribe`: `{ "type": "subscribe" }`
- `transcript.partial`: Server -> Client interim transcript.
- `transcript.committed`: Server -> Client confirmed sentence with speaker label.
- `vision.status`: Client -> Server landmark status (e.g., `{ hand_detected: true, gesture: "thumbs_up" }`).
- `inference.completed`: Server -> Client generated reply candidates with confidence scores.
- `confirmation.updated`: Client -> Server confirmed reply event.
- `speech.status`: Server -> Client TTS synthesis progress.
- `error`: Server -> Client recoverable error.

