# Security, Privacy and Consent Policy

## 1. Zero Raw Media Persistence
- Video camera frames are processed on-device (in the client browser) using MediaPipe.
- No raw video or audio recordings are uploaded or stored on disks by default.
- Only normalized, anonymized landmark metadata (e.g. gesture tags, lip-motion distance vectors) are passed to the inference layer.

## 2. Strict Confirmation Gate
- The AI LLM suggestion engine serves solely as an assistant proposer.
- Under NO circumstance does the backend or frontend automatically synthesize or dispatch a speech response without an explicit user confirmation action (`confirm` or `edit`).

## 3. Voice Cloning Consent Protocol
- Voice cloning or personalized vocal profile usage requires explicit informed consent registered via `/api/v1/voice-consents`.
- Users can instantly revoke consent via `/api/v1/voice-consents/{consent_id}`, which immediately blocks any subsequent audio generation with the cloned voice and falls back to standard approved voices.

## 4. Authentication & Data Protection
- Cryptographically secure JWT tokens with expiration.
- Passwords salted and hashed with `bcrypt`.
- Input validation on all requests using typed Pydantic models.
- CORS restricted to configured frontend origins.
- Sensitive vendor credentials stored strictly in backend environment variables and NEVER exposed to the frontend.

