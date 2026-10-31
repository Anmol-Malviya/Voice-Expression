# VoiceExpression: Multimodal Live Conversation Assistant
**AI Manthan 2.0 — Problem Statement 16**  
*An accessible live communication platform for people with speech impairments.*

[![Build & Backend Tests](https://img.shields.io/badge/backend%20tests-14%2F14%20passed-success)](file:///./backend/tests)
[![Frontend](https://img.shields.io/badge/frontend-Next.js%2014%20App%20Router-black)](file:///./frontend)
[![Accessibility](https://img.shields.io/badge/accessibility-WCAG%20AAA-blue)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Database](https://img.shields.io/badge/database-MongoDB%20Atlas%20%2B%20Resilient%20Fallback-green)](file:///./docs/database-schema.md)
[![API Documentation](https://img.shields.io/badge/API%20Docs-FastAPI%20Swagger-009688)](http://localhost:8000/docs)

---

## 1. Project Overview & Clinical Context
Individuals with speech impairments resulting from **ALS (Amyotrophic Lateral Sclerosis), Cerebral Palsy, Parkinson's Disease, Stroke, or Laryngectomy** often experience challenges with conventional voice-only speech recognition. 

**VoiceExpression** is a multimodal assistive platform designed to restore spontaneous, natural live communication. It captures:
1. **Incoming conversation partner speech** via Speech-to-Text.
2. **User visual cues and physical gestures** (hands, nods, lips) on-device.
3. **Contextual LLM intent fusion** proposing 2–4 rank-ordered candidate replies.
4. **Strict Confirmation Gate**: The AI *never* auto-speaks; the user must explicitly confirm or edit the sentence.
5. **Speech Synthesis**: Converts the confirmed message into natural, personalized audio.

---

## 2. Core Non-Negotiable Architectural Principles

- **Strict User Agency & Confirmation Gate**: AI suggestions are proposals only. Under no circumstances is an unconfirmed guess synthesized or dispatched.
- **Privacy First (Zero Raw Media Retention)**: Camera frames and audio buffers are processed in memory and on-device (client-side MediaPipe). No raw video or audio is stored on disk by default.
- **Voice Cloning Consent Lifecycle (SRC-07 / FR-013)**: Explicit informed consent is verified before any cloned voice model can be generated. Revocation immediately blocks subsequent clone generation.
- **Accessible by Design (WCAG AAA)**: High-contrast mode, text scaling (Standard, Large, X-Large), keyboard tab navigation, screen-reader labels, and large touch targets (> 52px).
- **Graceful Zero-Dependency Fallback**: All core workflows (STT, TTS, LLM, Database) run out-of-the-box locally with mock/browser fallbacks if external API keys or Atlas connections are unconfigured.

---

## 3. Technology Stack

### Frontend (Phase 2)
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5.6
- **Styling**: Tailwind CSS 3.4 & Framer Motion
- **State Management**: Zustand 4.5
- **Forms & Validation**: React Hook Form 7.53 & Zod 3.23
- **Icons & Notifications**: Lucide React 0.441 & Sonner Toaster
- **HTTP Client**: Axios with automatic JWT bearer interceptors

### Backend & Database (Phase 3)
- **Runtime & Framework**: Python 3.11+ / FastAPI 0.162 & Uvicorn 0.54
- **Data Validation**: Pydantic v2
- **Database Engine**: MongoDB Atlas (`ai_manthan`) via Motor 3.7 (Async PyMongo)
- **Resilient Fallback**: Thread-safe in-memory async document store (zero-crash fallback)
- **Authentication**: JWT (`python-jose`) & Password Hashing (`bcrypt` / `passlib`)
- **Testing**: Pytest & Asyncio (14/14 automated tests passed)

---

## 4. Quick Start (Run Both Servers)

### Prerequisites
- Node.js >= 18 LTS
- Python >= 3.10
- Optional: MongoDB Atlas connection string (in-memory engine runs automatically if unset)

### Step 1: Start FastAPI Backend (Port 8000)
```powershell
# From workspace root
.\backend\venv\Scripts\activate
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **API Base**: `http://localhost:8000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`
- **Health Check**: `http://localhost:8000/health`

### Step 2: Start Next.js Frontend (Port 3000)
```bash
# In a new terminal window
cd frontend
npm install
npm run dev
```
- **Web Application**: `http://localhost:3000`

---

## 5. Environment Variables Reference

### Backend (`backend/.env`)
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
DATABASE_NAME=ai_manthan
JWT_SECRET=manthan_super_secret_jwt_key_2026_ps16
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ELEVENLABS_API_KEY=
GEMINI_API_KEY=
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
HOST=0.0.0.0
PORT=8000
```

### Frontend (`frontend/.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

---

## 6. Live Application Routes

| Route | View | Description |
|---|---|---|
| `/` | Landing Page | Hero, interactive voice preview, feature showcase, accessible navigation |
| `/login` | Sign In | Email/password login, remember me, 1-click evaluator demo account login |
| `/register` | Sign Up | Full name, email, password, language, accessibility preferences setup |
| `/dashboard` | Dashboard | Active conversations, statistics, quick phrase bar, shortcuts |
| `/conversation/[id]` | Conversation Workspace | Split-screen live conversation, interim speech transcription, candidate replies, confirmation gate |
| `/gesture` | Gesture Workspace | Ephemeral camera preview, MediaPipe gesture detection, sentence builder, speak confirmation |
| `/settings` | Settings & Preferences | Voice rate/pitch, WCAG AAA text zoom/high contrast, phrase manager, voice clone consent |
| `/profile` | User Profile | Account information, preferred dialect, accessibility defaults, session stats |
| `/history` | Conversation History | Searchable transcripts, text export, audio line replay, permanent purge confirmation modal |

---

## 7. Automated Test Suite (100% Pass)

Run all backend verification tests:
```powershell
.\backend\venv\Scripts\python.exe -m pytest backend\tests -v
```

```text
============================= test session starts =============================
platform win32 -- Python 3.14.0, pytest-9.2.0, pluggy-1.7.0
plugins: anyio-4.15.1, asyncio-1.4.1

backend/tests/test_auth.py::test_health_check PASSED                     [  7%]
backend/tests/test_auth.py::test_user_registration_and_login PASSED      [ 14%]
backend/tests/test_gestures_and_preferences.py::test_gestures_and_quick_phrases PASSED [ 21%]
backend/tests/test_phase3_full.py::test_database_connection_and_health PASSED [ 28%]
backend/tests/test_phase3_full.py::test_user_registration_and_duplicate PASSED [ 35%]
backend/tests/test_phase3_full.py::test_login_success_and_failure PASSED [ 42%]
backend/tests/test_phase3_full.py::test_invalid_tokens_and_unauthorized_access PASSED [ 50%]
backend/tests/test_phase3_full.py::test_user_profile_retrieval_and_update PASSED [ 57%]
backend/tests/test_phase3_full.py::test_conversation_lifecycle_and_ownership PASSED [ 64%]
backend/tests/test_phase3_full.py::test_messages_creation_retrieval_and_cascade_delete PASSED [ 71%]
backend/tests/test_phase3_full.py::test_user_preferences_updates PASSED  [ 78%]
backend/tests/test_phase3_full.py::test_quick_phrases_crud PASSED        [ 85%]
backend/tests/test_sessions_and_messages.py::test_session_lifecycle_and_messages PASSED [ 92%]
backend/tests/test_speech_and_inference.py::test_speech_and_multimodal_inference PASSED [100%]

======================= 14 passed in 5.42s ========================
```

Run frontend TypeScript verification:
```bash
cd frontend
npx tsc --noEmit
# Exited with 0 errors
```

---

## 8. Documentation Index

- [Backend Architecture](file:///./docs/backend-architecture.md) — System flow, services, and fallback design
- [API Documentation](file:///./docs/api-documentation.md) — Full endpoint specifications and schemas
- [Database Schema](file:///./docs/database-schema.md) — MongoDB collections, indexes, and document structures
- [Backend Setup Guide](file:///./docs/backend-setup.md) — Step-by-step installation, MongoDB Atlas setup, and troubleshooting
- [Implementation Plan & Traceability Matrix](file:///./docs/implementation-plan.md) — Verification records for Phase 1, 2, and 3
