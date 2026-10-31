# Backend Architecture: VoiceExpression

**AI Manthan 2.0 — Problem Statement 16**  
*Multimodal Live Conversation Assistant for People with Speech Impairments*

---

## 1. Architectural Overview

VoiceExpression backend is engineered as an asynchronous, non-blocking, privacy-preserving REST and WebSocket API service powered by **FastAPI**, **Pydantic v2**, and **MongoDB Atlas** (with an in-memory asynchronous fallback engine).

```
                                      +---------------------------------------------+
                                      |            Next.js 14 Frontend              |
                                      +---------------------------------------------+
                                                             |
                                           REST API (HTTPS)  |  WebSockets (WSS)
                                                             v
+---------------------------------------------------------------------------------------------------------+
|                                        FastAPI Backend Application                                      |
|                                                                                                         |
|  +---------------------------------------------------------------------------------------------------+  |
|  | Middleware Pipeline: CORS, Authentication Token Inspector, Exception Envelopes, Ephemeral Memory  |  |
|  +---------------------------------------------------------------------------------------------------+  |
|                                                    |                                                    |
|            +---------------------------------------+---------------------------------------+            |
|            |                                       |                                       |            |
|            v                                       v                                       v            |
|  +--------------------+                  +--------------------+                  +--------------------+ |
|  | Auth & Users API   |                  | Conversation & Msg |                  | Prefs & Phrases    | |
|  | /api/v1/auth/*     |                  | /api/v1/convs/*    |                  | /api/v1/prefs/*    | |
|  | /api/v1/users/*    |                  | /api/v1/msgs/*     |                  | /api/v1/phrases/*  | |
|  +--------------------+                  +--------------------+                  +--------------------+ |
|            |                                       |                                       |            |
|            +---------------------------------------+---------------------------------------+            |
|                                                    |                                                    |
|                                                    v                                                    |
|                                    +-------------------------------+                                    |
|                                    |         Service Layer         |                                    |
|                                    |  - AuthService                |                                    |
|                                    |  - ConversationService        |                                    |
|                                    |  - MessageService             |                                    |
|                                    |  - PreferencesService         |                                    |
|                                    |  - PhraseService              |                                    |
|                                    +-------------------------------+                                    |
|                                                    |                                                    |
|                                                    v                                                    |
|                                    +-------------------------------+                                    |
|                                    |        Database Manager       |                                    |
|                                    |  - Motor (MongoDB Atlas)      |                                    |
|                                    |  - Local Async Memory Engine  |                                    |
|                                    +-------------------------------+                                    |
+---------------------------------------------------------------------------------------------------------+
                                                     |
                                                     v
                                  +-------------------------------------+
                                  |            Persistence              |
                                  |    MongoDB Atlas (`ai_manthan`)     |
                                  +-------------------------------------+
```

---

## 2. Core Security & Privacy Guarantees

1. **Zero Raw Media Retention (SRC-02 / FR-016)**:
   - Video frames and microphone buffers are processed in transient RAM and never stored to disk.
   - Hand and facial landmark extraction is completely ephemeral.

2. **Strict User Agency & Confirmation Gate (SRC-01)**:
   - The backend exposes candidate proposals via `/inference/candidates` but never synthesizes audio without an explicit user confirmation dispatch (`action: "confirm"`).

3. **Ownership Isolation (FR-014)**:
   - All conversation and message queries enforce tenant isolation: `{"user_id": current_user["id"]}`.
   - Attempting to inspect another user's conversation triggers an immediate `403 Forbidden`.

4. **Cryptographic Protection**:
   - Passwords hashed using bcrypt with safe truncation.
   - Access tokens signed using HMAC-SHA256 with 24-hour expiration.

---

## 3. Database Layer Strategy

- **Production Primary**: MongoDB Atlas cluster with connection pooling via Motor (`AsyncIOMotorClient`).
- **Resilient Fallback**: If `MONGODB_URI` is unconfigured or cluster connectivity fails during network partition, the application falls back seamlessly to `InMemoryCollection` without crashing, preserving offline usability.

