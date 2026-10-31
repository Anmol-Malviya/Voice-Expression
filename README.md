# VoiceExpression: Multimodal Live Conversation Assistant
**AI Manthan 2.0 — Problem Statement 16**  
*An accessible, privacy-first live communication platform for individuals with speech impairments.*

[![Backend Tests](https://img.shields.io/badge/backend%20tests-63%2F63%20passed%20(100%25)-success)](file:///./backend/tests)
[![Frontend Build](https://img.shields.io/badge/frontend-Next.js%2014%20App%20Router-black)](file:///./frontend)
[![Accessibility](https://img.shields.io/badge/accessibility-WCAG%202.1%20AAA-blue)](https://www.w3.org/WAI/standards-guidelines/wcag/)
[![Security & Privacy](https://img.shields.io/badge/privacy-Zero%20Raw%20Media%20Retention-green)](file:///./docs/security-checklist.md)
[![Database](https://img.shields.io/badge/database-MongoDB%20Atlas%20%2B%20Async%20Fallback-00ed64)](file:///./docs/database-schema.md)
[![AI Providers](https://img.shields.io/badge/AI%20Intelligence-Groq%20%7C%20ElevenLabs%20%7C%20MediaPipe-purple)](file:///./docs/final-architecture.md)

---

## 1. Clinical Context & Platform Purpose

Individuals experiencing speech impairments resulting from **ALS (Amyotrophic Lateral Sclerosis), Cerebral Palsy, Parkinson's Disease, Stroke, or Laryngectomy** frequently face extreme conversational fatigue and social exclusion with conventional voice-only assistants.

**VoiceExpression** is a multimodal assistive platform engineered to restore conversational autonomy:
1. **Listens to Conversation Partners**: Transcribes incoming speech into real-time text via Speech-to-Text.
2. **Recognizes Physical Non-Verbal Cues**: Runs client-side MediaPipe Tasks Vision to detect 8 distinct hand gestures and dynamic waving motions in ephemeral memory.
3. **Expands Telegraphic Shorthand**: Uses low-latency LLM intelligence (Groq Llama 3.3 70B / Gemini / OpenAI) to propose natural, polite first-person candidate sentences from minimal drafts (e.g., *"I water"* -> *"Could you please pass me a glass of water?"*).
4. **Strict Confirmation Gate (Non-Negotiable)**: The AI **never** auto-speaks. A human confirmation action (`Confirm`, `Edit`, or `Speak`) is strictly required before audio generation.
5. **Expressive Speech Synthesis**: Converts confirmed messages into natural audio via ElevenLabs neural voices or browser speech synthesis fallback.

---

## 2. Core Architectural Guardrails

- **Strict User Agency**: AI suggestions are proposals only. Under no circumstances is an unconfirmed guess synthesized or dispatched.
- **Privacy Defaults (Zero Media Retention)**: Camera frames and audio buffers are processed in ephemeral volatile memory. No raw video or audio is stored on disk without explicit consent.
- **Voice Cloning Consent Guard (SRC-07 / FR-013)**: Explicit informed consent in the `voice_consents` collection is verified before producing cloned voice audio. Consent can be revoked instantly.
- **Resilient Local Fallback**: Never crash or raise HTTP 500 when external cloud API keys (MongoDB Atlas, ElevenLabs, Groq, Gemini) are unconfigured. The system seamlessly transitions to an async in-memory database and browser Web Speech synthesis.
- **Accessibility by Design (WCAG 2.1 AAA)**: High-contrast mode (>19:1 ratio), text scaling (100%, 115%, 130%), keyboard tab navigation, large touch targets (> 52px), and screen-reader ARIA live regions.

---

## 3. Technology Stack

| Domain | Specified Technology | Repository Implementation | Verification Status |
|---|---|---|---|
| **Frontend Framework** | Next.js (App Router) | Next.js 14.2.35 (`frontend/src/app`) | **0 Errors, 11/11 Routes Optimized** |
| **Type Safety** | TypeScript | TypeScript 5.6.2 (`src/types/`) | **Compiled 0 Errors (`tsc --noEmit`)** |
| **Styling & Theme** | Tailwind CSS & Framer Motion | Tailwind CSS 3.4.10 (`globals.css`) | **WCAG AAA High Contrast & Scaling** |
| **State Management** | Zustand & LocalStorage | `zustand` 4.5.5 (`useAppStore.ts`) | **Verified** |
| **Backend Framework** | FastAPI & Uvicorn | FastAPI 0.162 + Uvicorn 0.54 | **Running on port 8000** |
| **Validation** | Pydantic v2 & Zod | Pydantic 2.14 & Zod 3.23 | **Verified** |
| **Live Communication** | WebSockets | WebSocket endpoints `/ws/*` | **Bi-directional streaming verified** |
| **Authentication** | JWT & Bcrypt | `python-jose` + `bcrypt` 5.0 | **Verified (Invalid & Expired token rejection)** |
| **Database** | MongoDB Atlas / PyMongo / Motor | Motor 3.7.0 + Async Memory Fallback | **Verified dual-mode** |
| **Conversational AI** | Groq LLM / OpenAI / Gemini | `backend/app/services/llm/` | **Verified (Llama 3.3 70B & Heuristic)** |
| **Speech (TTS & STT)** | ElevenLabs Neural TTS & Scribe | `backend/app/services/tts/` & `stt/` | **Verified (MP3/WAV with Fallback)** |
| **Computer Vision** | MediaPipe Tasks & OpenCV | `backend/app/services/gesture/` | **OpenCV 5.0 + MediaPipe 21 Hand Joints** |

---

## 4. Quick Start Guide

### Prerequisites
- Node.js >= 18 LTS
- Python >= 3.10
- Optional: MongoDB Atlas URI, Groq API Key, ElevenLabs API Key (System runs fully offline if omitted)

### Step 1: Start FastAPI Backend (Port 8000)
```powershell
# From workspace root
.\backend\venv\Scripts\activate
$env:PYTHONPATH="."
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **API Base**: `http://localhost:8000/api/v1`
- **Interactive Swagger Docs**: `http://localhost:8000/docs`
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

## 5. Automated Verification & Testing Commands

### Backend Pytest Suite (63 Tests, 100% Pass)
```powershell
$env:PYTHONPATH="."; backend\venv\Scripts\pytest backend/tests/ -v
```

### Real Cloud Provider Verification
```powershell
$env:PYTHONPATH="."; backend\venv\Scripts\python.exe backend/scripts/verify_real_providers.py
```

### Frontend Type Safety, Linting, & Production Build
```bash
cd frontend
npx tsc --noEmit
npm run lint
npm run build
```

---

## 6. Application Routes & Key Workflows

| Route | View Description | Key Assistive Capabilities |
|---|---|---|
| `GET /` | **Landing Page** | Voice preview, multimodal simulation, WCAG AAA accessibility toolbar |
| `GET /login` | **Authentication** | Email/Password validation, 1-Click Evaluator Demo Profile (Alex Mercer) |
| `GET /register` | **Registration** | Account setup, preferred language, initial accessibility configuration |
| `GET /dashboard` | **Assistive Dashboard** | Recent sessions, usage metrics, 14 categorized 1-tap quick phrases |
| `GET /conversation/[id]` | **Conversation Workspace** | Live speech-to-text, shorthand clarifier, AI candidate review, confirmation gate |
| `GET /gesture` | **Gesture Workspace** | Live camera preview, 21-point skeletal overlay, 8-gesture vocabulary tiles, voice synthesis |
| `GET /settings` | **Preferences & Controls** | Dialect switcher, voice test, text size (100%–130%), high-contrast toggle, voice cloning consent |
| `GET /profile` | **Patient Profile** | Identity card, verified patient badge, accessibility settings, session statistics |
| `GET /history` | **Conversation History** | Searchable dialogue history, transcript text export, audio line replay, permanent purge |

---

## 7. Documentation Index

- [Final Architecture](file:///./docs/final-architecture.md) — Comprehensive technical architecture, data flows, and subsystem specifications.
- [Testing Report](file:///./docs/testing-report.md) — Complete 63-test execution results, Workflows A–F, and provider verification logs.
- [Deployment Guide](file:///./docs/deployment-guide.md) — Production deployment instructions for Vercel, Render, and MongoDB Atlas.
- [Security & Privacy Checklist](file:///./docs/security-checklist.md) — Security audit matrix, JWT/Bcrypt verification, and ephemeral biometric guarantees.
- [Hackathon Demo Guide](file:///./docs/hackathon-demo-guide.md) — Step-by-step 5-minute evaluator walk-through with scripted talking points.
- [API Documentation](file:///./docs/api-documentation.md) — REST endpoints, parameters, envelopes, and WebSocket channels.
- [Database Schema](file:///./docs/database-schema.md) — MongoDB collections, indexes, and document data models.
