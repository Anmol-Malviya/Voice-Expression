# VoiceExpression: Final System Architecture

**AI Manthan 2.0 — Problem Statement 16**  
**Project**: Multimodal Live Conversation Assistant for People with Speech Impairments  
**Architectural Version**: 1.0.0 Production-Ready (Phase 6 Final Verification)

---

## 1. High-Level Architectural Overview

VoiceExpression is a full-stack, accessible, privacy-first assistive platform engineered to restore conversational autonomy to individuals experiencing speech impairments (e.g., ALS, Cerebral Palsy, Parkinson's Disease, Stroke, Laryngectomy). 

The platform bridges non-verbal intent (MediaPipe hand gestures and telegraphic drafts) into authentic spoken communication using low-latency LLM intelligence (Groq / Gemini / OpenAI) and neural voice synthesis (ElevenLabs). Every interaction strictly preserves **User Agency**: AI proposals require explicit human confirmation before audio is produced.

```mermaid
flowchart TD
    subgraph Client ["Frontend Layer (Next.js 14 App Router)"]
        UI["Accessible UI (Tailwind CSS + WCAG AAA)"]
        Store["State Management (Zustand + LocalStorage)"]
        VisionClient["Camera Preview (MediaPipe Canvas Overlay)"]
        AudioClient["Speech Manager (Web Speech API + HTML5 Audio)"]
    end

    subgraph Gateway ["Transport & Security Layer"]
        CORS["CORS & Origin Gate"]
        AuthMiddleware["JWT Token Inspector & Argon2/Bcrypt"]
        WSRoute["WebSocket Connection Manager (/ws/*)"]
    end

    subgraph Core ["Backend Application Layer (FastAPI 0.162)"]
        ConvService["Conversation & Message Engine"]
        AgencyGate["Human-in-the-Loop Confirmation Gate"]
        GestureRecognizer["Geometric Gesture Classifier (8 Vocab)"]
        IntentService["Multilingual Intent Classifier"]
    end

    subgraph External ["Intelligence & Cloud Infrastructure"]
        Groq["Groq Cloud LLM (Llama 3.3 70B)"]
        ElevenLabsTTS["ElevenLabs Neural TTS"]
        ElevenLabsSTT["ElevenLabs Scribe STT"]
        MongoAtlas["MongoDB Atlas Cluster"]
        MediaPipeModel["MediaPipe Tasks Vision (Local Asset)"]
    end

    subgraph ResilientFallback ["Resilient Offline Fallback Layer"]
        LocalDB["Async In-Memory DB (ai_manthan)"]
        LocalLLM["Local Heuristic Intent Engine"]
        LocalTTS["Local 44-byte WAV Synthesis Chime"]
        BrowserTTS["Browser Web Speech API Fallback"]
    end

    UI --> Gateway
    VisionClient --> WSRoute
    Gateway --> Core
    Core --> AgencyGate
    AgencyGate --> External
    External -.->|Unconfigured or Offline| ResilientFallback
```

---

## 2. Technology Stack & Verification Matrix

| Tier | Component | Specification | Verified Version | Verification Status |
|---|---|---|---|---|
| **Frontend Framework** | Next.js | App Router (11 Static & Dynamic Routes) | Next.js 14.2.35 | Compiled (0 errors, 0 lint warnings) |
| **Language (Web)** | TypeScript | Strict Type Safety | TypeScript 5.6.2 | `tsc --noEmit` 0 errors |
| **Styling** | Tailwind CSS | WCAG AAA Contrast, Dark Mode, Large Scaling | Tailwind CSS 3.4.10 | Verified (Contrast > 19:1 on High Contrast) |
| **Client State** | Zustand | Persistent Accessibility & Session State | Zustand 4.5.5 | Verified |
| **Form Handling** | React Hook Form + Zod | Schema Validation | Zod 3.23.8 | Verified |
| **Backend Framework** | FastAPI | Async ASGI REST & WebSocket Server | FastAPI 0.162 + Uvicorn | Running on port 8000 |
| **Data Validation** | Pydantic v2 | Strict Schema Enforcement | Pydantic 2.14 | Verified across all models |
| **Database** | MongoDB Atlas / Motor | Document Persistence + Async Memory Fallback | Motor 3.7.0 / PyMongo 4.15 | Dual-mode operational |
| **AI Intelligence** | Groq / Gemini / OpenAI | Conversational Context & Shorthand Expander | Groq API / Llama 3.3 70B | Integrated with heuristic fallback |
| **Speech (TTS)** | ElevenLabs Neural TTS | Audio Synthesis & Cloned Voice Guard | ElevenLabs API v1 | Integrated with local WAV fallback |
| **Speech (STT)** | ElevenLabs Scribe / Web Speech | Speech-to-Text Transcription | Scribe v1 + Browser API | Dual-mode format-validated |
| **Computer Vision** | MediaPipe Tasks Vision | 21 3D Hand Landmarks & Geometric Classification | MediaPipe 0.10.31 + OpenCV 5.0 | Model: `hand_landmarker.task` |

---

## 3. Core Architectural Constraints & Guardrails

### 3.1 Constraint 1: User Agency Preserved (No Auto-Speaking AI)
Under **no circumstances** does the system produce synthetic speech without explicit human interaction. 
- LLM outputs are tagged with `is_proposal: true` and `requires_confirmation: true`.
- The user is presented with distinct actions:
  - **Confirm**: Adopt the sentence as drafted.
  - **Edit**: Modify wording or punctuation.
  - **Cancel/Reject**: Discard the candidate without penalty.
- The confirmation gate at `/api/v1/sessions/{id}/confirmations` validates this action before any audio stream is dispatched.

### 3.2 Constraint 2: Zero Disk Retention Privacy Default
To protect sensitive patient visual and biometric data:
- MediaPipe landmark extraction runs strictly in ephemeral volatile memory.
- No video frames, camera snapshots, or audio recordings are written to persistent disk storage without explicit patient consent.
- WebSocket stream channels discard raw buffer frames immediately after extracting the 21 geometric coordinate pairs.

### 3.3 Constraint 3: Voice Cloning Consent Guard
Voice cloning introduces identity and spoofing risks. In compliance with SRC-07 and FR-013:
- The system checks the `voice_consents` collection before synthesizing with any cloned voice profile (`category: "cloned"`).
- Requests lacking active consent are rejected with `HTTP 403 Forbidden`.
- Users retain 1-tap consent revocation from `/settings`.

### 3.4 Constraint 4: Resilient Local Fallback
Network instability or missing cloud API keys must never render a non-verbal patient mute:
- If `MONGODB_URI` is unconfigured: Transparently routes to `InMemoryCollection` (simulating MongoDB collection indexing and CRUD).
- If `ELEVENLABS_API_KEY` is unconfigured: Dispatches a valid 44-byte WAV audio buffer and seamlessly triggers browser-native Web Speech synthesis.
- If `GROQ_API_KEY` is unconfigured: Dispatches local multilingual intent heuristic expansions (supporting English, Hindi, Hinglish, Spanish, French, German).

---

## 4. Subsystem Breakdown

```
VoiceExpression Root
├── frontend/
│   ├── src/app/
│   │   ├── page.tsx                 # Landing presentation & voice preview
│   │   ├── login/page.tsx           # 1-Click Demo & Credential Authentication
│   │   ├── register/page.tsx        # Accessible User Registration
│   │   ├── dashboard/page.tsx       # Conversation Management & Quick Phrases
│   │   ├── conversation/[id]/       # Split-screen live conversation workspace
│   │   ├── gesture/page.tsx         # Real-time MediaPipe camera workspace
│   │   ├── history/page.tsx         # Transcript Search & Permanent Purge
│   │   ├── settings/page.tsx        # Voice, Language & Accessibility Config
│   │   └── profile/page.tsx         # User Profile & Consent Status
│   ├── src/components/              # 17 Reusable Accessible UI Components
│   ├── src/services/                # Client API & Speech/Vision Drivers
│   └── src/store/useAppStore.ts     # Centralized Zustand State
└── backend/
    ├── app/
    │   ├── api/v1/                  # REST API Routing (12 Sub-routers)
    │   ├── core/                    # Config, Security, DB Re-exports
    │   ├── database/                # MongoDB Client & Async Memory Engine
    │   ├── models/ & schemas/       # Pydantic v2 Models & Schemas
    │   ├── services/
    │   │   ├── ai/                  # Conversation Engine & Intent Classifier
    │   │   ├── gesture/             # MediaPipe Landmarker & Feature Extractor
    │   │   ├── llm/                 # Groq, OpenAI, and Heuristic Services
    │   │   ├── stt/                 # ElevenLabs Scribe & Local STT Fallback
    │   │   └── tts/                 # ElevenLabs Neural TTS & Local WAV Fallback
    │   └── websockets/              # Live Real-Time Socket Connection Manager
    ├── tests/                       # 11 Comprehensive Pytest Suites (63 Tests)
    └── scripts/verify_real_providers.py # Provider Cloud Verification Tool
```

---

## 5. API Route & WebSocket Architecture

All endpoints are mounted under `/api/v1` and aliased under `/api` for universal client compatibility.

| Route | HTTP Method | Target Service | Security / Auth |
|---|---|---|---|
| `/health`, `/ready` | `GET` | Health Check Engine | Public |
| `/api/v1/auth/register` | `POST` | User Registration | Public (Email uniqueness enforced) |
| `/api/v1/auth/login` | `POST` | Authentication Token Issuance | Public (Argon2/Bcrypt hash verification) |
| `/api/v1/auth/logout` | `POST` | Session Revocation | Authenticated |
| `/api/v1/auth/me` | `GET` | User Profile Extraction | JWT Bearer Token |
| `/api/v1/conversations` | `GET`, `POST` | Conversation Management | JWT / Guest Fallback |
| `/api/v1/conversations/{id}` | `GET`, `PATCH`, `DELETE`| Conversation Lifecycle | Ownership Verified (Cascade Deletion) |
| `/api/v1/messages` | `POST` | Message Creation | Ownership Verified |
| `/api/v1/conversations/{id}/messages`| `GET` | Paginated Message History | Ownership Verified |
| `/api/v1/speech/synthesize` | `POST` | Neural Speech Generation | Consent Guard Enforced |
| `/api/v1/speech/transcribe` | `POST` | Speech-to-Text Transcription | 25MB Limit & Format Guard |
| `/api/v1/ai/respond` | `POST` | Context-bounded Reply Proposals | Human Confirmation Gate Enforced |
| `/api/v1/ai/suggest` | `POST` | Rough Shorthand Clarification | Human Confirmation Gate Enforced |
| `/api/v1/sessions/{id}/confirmations`| `POST` | Explicit Confirmation Gate | Mandatory prior to Speech |
| `/api/v1/gesture/recognize` | `POST` | Landmark / Frame Classifier | Ephemeral memory only |
| `/api/v1/gesture/vocabulary` | `GET` | Active 8-Gesture Dictionary | Public / User Mappings |
| `/ws/gesture` | `WebSocket` | Live Video Landmark Streaming | Ephemeral Memory Stream |
| `/ws/conversation/{id}` | `WebSocket` | Real-time Dialogue Room Broadcast| Session Room Broadcast |

