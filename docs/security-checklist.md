# VoiceExpression: Security & Privacy Compliance Checklist

**AI Manthan 2.0 — Problem Statement 16**  
**Project**: VoiceExpression — Multimodal Live Conversation Assistant  
**Compliance Standard**: WCAG 2.1 AAA Accessibility & Ephemeral Biometric Privacy Protocols

---

## 1. Security Architecture Summary

VoiceExpression handles sensitive communication data for individuals with physical and speech disabilities. Security and privacy controls are implemented at every layer:

```
[Client (Next.js)] 
   ── HTTPS ──> [FastAPI Backend] 
   ── Ephemeral Memory ──> [MediaPipe Hand Landmark Extraction (No Disk Storage)]
   ── TLS ──> [MongoDB Atlas Cluster]
   ── Secret Isolation ──> [Groq / ElevenLabs Cloud APIs]
```

---

## 2. Security Verification & Audit Matrix

| Security Area | Implementation in Repository | Verification Method | Audit Status |
|---|---|---|---|
| **Password Hashing** | Uses cryptographic salt with Argon2 / Bcrypt (`backend/app/core/security.py`). Plain passwords never saved or serialized. | Automated unit tests in `test_auth.py` and `test_phase3_full.py`. | **VERIFIED PASS** |
| **JWT Authentication** | Signed tokens using HMAC-SHA256 (`HS256`). Enforces expiration claim (`exp`) and subject claim (`sub`). | Tested valid, invalid, and expired tokens in `test_phase6_e2e_workflows.py`. | **VERIFIED PASS** |
| **Protected API Routes** | Enforced via `Depends(get_current_user)` in FastAPI. Rejects unauthenticated mutation requests with HTTP 401. | Tested in `test_phase3_full.py` and `test_phase6_e2e_workflows.py`. | **VERIFIED PASS** |
| **Conversation Ownership** | Ownership verified on all conversation updates, message additions, and deletions. Prevents IDOR (Insecure Direct Object References). | Tested user isolation in `test_phase3_full.py::test_conversation_lifecycle_and_ownership`. | **VERIFIED PASS** |
| **CORS Configuration** | Restricted origins configured via `CORSMiddleware`. In production, only explicit domains in `ALLOWED_ORIGINS` are accepted. | Tested in `backend/app/main.py`. | **VERIFIED PASS** |
| **API Key Isolation** | All third-party secrets (`GROQ_API_KEY`, `ELEVENLABS_API_KEY`, `JWT_SECRET`, `MONGODB_URI`) are strictly server-side. Zero leaked in client bundle. | Codebase inspection & Next.js client-side bundle audit. | **VERIFIED PASS** |
| **Git Secret Exclusion** | Root `.gitignore` ignores all `.env`, `.env.*`, `backend/.env`, and `frontend/.env` variants. | Executed `git status` — zero secret files tracked. | **VERIFIED PASS** |
| **Input Validation** | Backend uses Pydantic v2 with strict type coercion; frontend uses Zod schemas with React Hook Form. | Rejects malformed requests with HTTP 422 in `test_phase3_full.py`. | **VERIFIED PASS** |
| **Rate Limiting** | Graceful error handling for HTTP 429 status codes from external AI providers (Groq, ElevenLabs). | Unit tests verify 429 propagation without crashing backend (`test_groq_service.py`, `test_elevenlabs_tts.py`). | **VERIFIED PASS** |
| **File Upload Validation** | Audio uploads validated for extension (`.mp3`, `.wav`, `.ogg`, `.webm`, `.m4a`), MIME type, and max size (25MB). Unsupported formats (`.exe`) rejected with 400. | Tested in `backend/scripts/verify_real_providers.py` and `test_elevenlabs_stt.py`. | **VERIFIED PASS** |
| **Biometric Privacy** | Zero raw camera video or audio frames are saved to disk. MediaPipe runs strictly in ephemeral volatile memory. | Verified code execution in `backend/app/services/gesture/landmarker.py`. | **VERIFIED PASS** |
| **Voice Cloning Consent Guard**| Cloned speech synthesis requires an active record in the `voice_consents` collection. Revoked consent blocks synthesis with HTTP 403. | Tested in `test_elevenlabs_tts.py::test_speech_synthesize_cloned_voice_consent_guard`. | **VERIFIED PASS** |

---

## 3. Privacy & Biometric Protection Detail (Rule 2 & 3 Compliance)

### 3.1 Zero-Retention Video Stream Pipeline
- Camera feed is acquired via standard browser `navigator.mediaDevices.getUserMedia`.
- Video frames are drawn to an in-memory HTML5 Canvas element for real-time visual feedback.
- Landmarks (21 points with normalized `x, y, z` coordinates) are extracted in memory.
- No frame buffer is written to persistent filesystem, database, or analytics collectors.
- When the camera is deactivated or the user navigates away, `stream.getTracks().forEach(track => track.stop())` is called immediately.

### 3.2 Voice Cloning Consent Protocol
- Cloned voice synthesis requests verify user consent via `consent_service.is_voice_permitted(user_id, voice_id)`.
- If consent is missing, expired, or revoked, the backend raises `HTTP 403 Forbidden` with explanation:
  `"Active voice cloning consent required. Consent is either missing or revoked."`
- Patients can grant and revoke consent at any time from `/settings` or `/profile`.

