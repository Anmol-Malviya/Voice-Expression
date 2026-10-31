# Backend Setup & Deployment Guide

## VoiceExpression — AI Manthan 2.0 (Problem Statement 16)

This document provides complete instructions for setting up, configuring, testing, and running the Python FastAPI backend service and integrating it with MongoDB Atlas and the Next.js 14 frontend.

---

## 1. Prerequisites

Before starting, ensure your system has:

- **Python**: Version 3.10, 3.11, or 3.12+ (tested on Python 3.14)
- **Node.js**: Version 18.x or 20.x LTS (for frontend integration)
- **Package Managers**: `pip` (Python) and `npm` (Node.js)
- **Optional**: Free MongoDB Atlas Account & Cluster (a resilient async in-memory database engine is automatically used if no Atlas URI is provided).

---

## 2. Directory Structure

```text
backend/
├── app/
│   ├── main.py                     # Application entry point, lifespan, CORS, and routing
│   ├── core/
│   │   ├── config.py               # Pydantic v2 application settings and env parsing
│   │   ├── security.py             # Password hashing (Argon2/bcrypt) & JWT issuance/validation
│   │   └── dependencies.py         # FastAPI dependency injection (get_current_user)
│   ├── database/
│   │   ├── mongodb.py              # Async Motor driver + resilient InMemory fallback
│   │   └── indexes.py              # Database index definitions and auto-creation
│   ├── models/                     # Internal domain models
│   ├── schemas/                    # Pydantic v2 request/response schemas
│   ├── services/                   # Business logic (Auth, Conversation, Message, Preferences, Phrases)
│   ├── api/v1/                     # REST API v1 endpoints
│   ├── middleware/                 # Request/Response interceptors & auth middleware
│   └── utils/                      # Standardized response envelopes & ObjectId helpers
├── tests/                          # Pytest test suites (14/14 automated tests)
├── requirements.txt                # Python dependencies
└── .env.example                    # Environment variable template
```

---

## 3. Installation & Virtual Environment Setup

### Windows (PowerShell)
```powershell
# 1. Navigate to the project root directory
cd c:\Users\gamin\OneDrive\Desktop\Voice-Expression

# 2. Create a virtual environment (if not already created)
python -m venv backend\venv

# 3. Activate the virtual environment
.\backend\venv\Scripts\Activate.ps1

# 4. Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r backend\requirements.txt
```

### Linux / macOS (Bash)
```bash
# 1. Navigate to the project root directory
cd Voice-Expression

# 2. Create a virtual environment
python3 -m venv backend/venv

# 3. Activate the virtual environment
source backend/venv/bin/activate

# 4. Upgrade pip and install dependencies
pip install --upgrade pip
pip install -r backend/requirements.txt
```

---

## 4. Environment Variables Configuration

Copy `backend/.env.example` to `backend/.env` (or configure system environment variables):

```bash
# On Windows
copy backend\.env.example backend\.env

# On Linux/macOS
cp backend/.env.example backend/.env
```

### Configuration Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `MONGODB_URI` | No | `""` | MongoDB Atlas connection string. If omitted, the engine uses the async in-memory database with zero crash. |
| `DATABASE_NAME` | No | `ai_manthan` | MongoDB database name. |
| `JWT_SECRET` | Yes | `manthan_super_secret_jwt_key_2026_ps16` | Cryptographic secret for signing JWT access tokens. |
| `JWT_ALGORITHM` | No | `HS256` | Token signing algorithm. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `10080` (7 days) | Access token validity window. |
| `ELEVENLABS_API_KEY` | No | `""` | Optional key for cloud speech synthesis and speech-to-text. |
| `GEMINI_API_KEY` | No | `""` | Optional key for cloud LLM candidate generation. |
| `CORS_ORIGINS` | No | `http://localhost:3000,http://localhost:5173` | Allowed frontend origins. |
| `HOST` | No | `0.0.0.0` | Server bind host. |
| `PORT` | No | `8000` | Server bind port. |

> [!NOTE]
> **Resilient Local Fallback**: When `MONGODB_URI` is not set, the backend operates transparently using an in-memory document store supporting `$or`, `$and`, `$in`, `$ne`, pagination, and index constraints. External cloud APIs (Gemini, ElevenLabs) fall back to local rule-based intent engines and browser speech synthesis.

---

## 5. MongoDB Atlas Setup

To connect to a production or development MongoDB Atlas database:

1. Log in to [MongoDB Atlas](https://cloud.mongodb.com/).
2. Create or select a cluster (e.g. `Cluster0` free M0 tier).
3. Under **Security &rarr; Database Access**, create a user with `readWriteAnyDatabase` or scoped read/write permissions to `ai_manthan`.
4. Under **Security &rarr; Network Access**, add your current IP address (or `0.0.0.0/0` for development sandbox).
5. Click **Connect &rarr; Drivers &rarr; Python**, copy the connection string, and set it in `backend/.env`:
   ```env
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/?retryWrites=true&w=majority
   DATABASE_NAME=ai_manthan
   ```
6. On startup, the backend lifespan hook automatically executes `ensure_indexes()`, provisioning:
   - Unique index on `users.email`
   - Secondary indexes on `conversations.user_id`, `conversations.updated_at`
   - Secondary indexes on `messages.conversation_id`, `messages.created_at`
   - Secondary indexes on `user_preferences.user_id`
   - Compound indexes on `quick_phrases.user_id`, `quick_phrases.category`

---

## 6. Running the Server

### Development Mode (with hot-reload)
```powershell
.\backend\venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```

Once running:
- **API Base URL**: `http://localhost:8000/api/v1`
- **Swagger UI Interactive Documentation**: `http://localhost:8000/docs`
- **ReDoc Documentation**: `http://localhost:8000/redoc`
- **Health Check Endpoint**: `http://localhost:8000/health` or `http://localhost:8000/api/v1/health`

### Production Mode
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

---

## 7. Running the Automated Test Suite

The test suite covers database initialization, authentication, user profiles, conversation lifecycle, message cascading deletion, preferences, and quick phrase CRUD.

Run all tests:
```powershell
.\backend\venv\Scripts\python.exe -m pytest backend\tests -v
```

### Verified Test Cases (14/14 Passing)

| Test File | Test Name | Coverage |
|---|---|---|
| `test_auth.py` | `test_health_check` | Server status and database health check |
| `test_auth.py` | `test_user_registration_and_login` | User signup, JWT issuance, token verification |
| `test_gestures_and_preferences.py` | `test_gestures_and_quick_phrases` | Gesture dictionary retrieval, phrase listing |
| `test_phase3_full.py` | `test_database_connection_and_health` | Motor / InMemory connection verification |
| `test_phase3_full.py` | `test_user_registration_and_duplicate` | Signup & duplicate email conflict (409) handling |
| `test_phase3_full.py` | `test_login_success_and_failure` | Valid credentials vs. wrong password validation |
| `test_phase3_full.py` | `test_invalid_tokens_and_unauthorized_access` | Strict 401 Unauthorized protection on `/users/me` |
| `test_phase3_full.py` | `test_user_profile_retrieval_and_update` | Profile retrieval and PATCH updates |
| `test_phase3_full.py` | `test_conversation_lifecycle_and_ownership` | Create, list, retrieve, and cross-user ownership isolation |
| `test_phase3_full.py` | `test_messages_creation_retrieval_and_cascade_delete` | Message creation, retrieval, and cascading deletion on conversation purge |
| `test_phase3_full.py` | `test_user_preferences_updates` | Accessibility and voice preferences updates |
| `test_phase3_full.py` | `test_quick_phrases_crud` | Phrases Create, Read, Update, Delete with ownership |
| `test_sessions_and_messages.py` | `test_session_lifecycle_and_messages` | Session creation, message exchange, and dialogue retrieval |
| `test_speech_and_inference.py` | `test_speech_and_multimodal_inference` | Multimodal candidate proposals & human confirmation gate |

---

## 8. Frontend Integration

1. Ensure the backend is running on `http://localhost:8000`.
2. Configure `frontend/.env.local`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
   ```
3. Start the Next.js development server:
   ```bash
   cd frontend
   npm run dev
   ```
4. Access the web application at `http://localhost:3000`.
5. Authenticate via `/login` or use the 1-click **Demo Login** button to test live end-to-end communication with the FastAPI backend.

