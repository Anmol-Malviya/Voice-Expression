# System Architecture

## Architecture Diagram

```
+-------------------------------------------------------------+
|                 Browser Client (React + Vite)               |
|                                                             |
|  [Microphone Input]  [Webcam Vision Feed]   [Quick Phrases] |
|        |                     |                     |        |
|  Web Speech / ElevenLabs   MediaPipe Hands/Face    Keyboard |
|        |                     |                     |        |
|  [Accessible Live Conversation UI with Confirmation Gate]   |
+------------------------------+------------------------------+
                               | HTTPS REST + WebSocket
                               v
+-------------------------------------------------------------+
|               FastAPI Backend Orchestrator                  |
|                                                             |
|  - Session Lifecycle & JWT Authorization Layer              |
|  - Real-time WebSocket Hub (/ws/sessions/{id})              |
|  - Multimodal Fusion Engine (Temporal Audio-Visual align)   |
|  - Context-Aware Intent Service (LLM / Rule fallback)       |
|  - Confirmation Gate & Voice Consent Enforcement            |
|  - TTS Synthesis & Audio Provider Manager                   |
|  - Latency Instrumentation & Telemetry                      |
+------------------------------+------------------------------+
                               |
            +------------------+------------------+
            |                                     |
            v                                     v
+-------------------------+             +-------------------+
|      MongoDB Atlas      |             |   External AI     |
| (Async PyMongo / Mock)  |             |  - ElevenLabs     |
| - Users & Preferences   |             |  - LLM Provider   |
| - Sessions & Metadata   |             |    (Gemini/OpenAI)|
| - Voice Consents        |             +-------------------+
| - Evaluation Metrics    |
+-------------------------+
```

## Modular Directory Structure
```
Voice-Expression/
├── backend/
│   ├── app/
│   │   ├── api/v1/         # Versioned REST endpoints
│   │   ├── core/           # Security, config, db, logging
│   │   ├── models/         # Domain models
│   │   ├── schemas/        # Pydantic v2 validation contracts
│   │   ├── services/       # Business logic (fusion, LLM, TTS, STT)
│   │   ├── websockets/     # WebSocket session connection manager
│   │   └── main.py         # FastAPI application entrypoint
│   ├── tests/              # Pytest test suite
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable accessible UI components
│   │   ├── pages/          # 8 Core application pages
│   │   ├── contexts/       # Auth, Theme, Speech providers
│   │   ├── hooks/          # WebSocket, media hooks
│   │   ├── services/       # API clients
│   │   ├── utils/          # Formatting & helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── tailwind.config.js
└── docs/                   # Full engineering specifications
```

