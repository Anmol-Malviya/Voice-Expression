# VoiceExpression: Production Deployment Guide

**AI Manthan 2.0 — Problem Statement 16**  
**Target Environments**: Vercel (Frontend), Render / Railway / Container (Backend), MongoDB Atlas (Database)

---

## 1. Architecture & Hosting Topology

VoiceExpression is decoupled into:
1. **Frontend**: Next.js 14 (App Router) deployed as a serverless/edge-optimized web application on **Vercel**.
2. **Backend**: Python FastAPI (ASGI) application deployed as a continuous web service with WebSocket support on **Render** (or Railway).
3. **Database**: Managed **MongoDB Atlas** M0/M10 replica set cluster with SSL/TLS transport.

```mermaid
flowchart LR
    User["Patient / Conversation Partner"]
    VercelApp["Vercel (Next.js 14 Frontend)"]
    RenderBackend["Render (FastAPI + WebSockets)"]
    MongoCluster["MongoDB Atlas Cluster"]
    GroqCloud["Groq Cloud LLM"]
    ElevenLabsAPI["ElevenLabs Neural Voice API"]

    User -->|HTTPS| VercelApp
    User -->|WSS & HTTPS| RenderBackend
    VercelApp -->|HTTPS REST| RenderBackend
    RenderBackend -->|TLS / MONGODB_URI| MongoCluster
    RenderBackend -->|REST API| GroqCloud
    RenderBackend -->|REST API| ElevenLabsAPI
```

---

## 2. Pre-Deployment Configuration & Secrets Checklist

> [!CAUTION]
> **Production Rule**: Never deploy with development fallback mode represented as live production functionality. Cloud API credentials must be populated in the production hosting dashboard for real Atlas persistence and neural speech synthesis.

### 2.1 Backend Environment Variables (Render / Railway)

| Variable | Required | Production Value / Format | Purpose |
|---|---|---|---|
| `APP_ENV` | Yes | `production` | Enables strict CORS and security rules |
| `APP_HOST` | Yes | `0.0.0.0` | Container network bind address |
| `APP_PORT` | Yes | `8000` (or injected `$PORT`) | Web server listen port |
| `ALLOWED_ORIGINS` | Yes | `https://your-app.vercel.app` | Comma-separated allowed frontend domains |
| `JWT_SECRET` | Yes | High-entropy 64-char hex string | HMAC-SHA256 signature key for JWT tokens |
| `JWT_ALGORITHM` | Yes | `HS256` | JWT algorithm |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Yes | `1440` (24 hours) | Token lifespan |
| `MONGODB_URI` | Yes | `mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority` | Atlas connection string |
| `MONGODB_DATABASE` | Yes | `ai_manthan` | MongoDB database name |
| `GROQ_API_KEY` | Optional | `gsk_...` | Groq Conversational Intelligence API key |
| `GROQ_MODEL` | Optional | `llama-3.3-70b-versatile` | Ultra-low latency LLM model |
| `ELEVENLABS_API_KEY` | Optional | `sk_...` | ElevenLabs TTS and Scribe STT API key |
| `ELEVENLABS_DEFAULT_VOICE_ID` | Optional | `21m00Tcm4TlvDq8ikWAM` | Assistive default voice ID |
| `ELEVENLABS_TTS_MODEL` | Optional | `eleven_multilingual_v2` | Multilingual neural speech model |

### 2.2 Frontend Environment Variables (Vercel)

| Variable | Required | Production Value / Format | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_API_URL` | Yes | `https://your-backend.onrender.com/api/v1` | Public API gateway base URL |
| `NEXT_PUBLIC_WS_URL` | Yes | `wss://your-backend.onrender.com` | Secure WebSocket connection URL |

> [!WARNING]
> **API Key Isolation**: Never prefix backend credentials (`JWT_SECRET`, `GROQ_API_KEY`, `ELEVENLABS_API_KEY`, `MONGODB_URI`) with `NEXT_PUBLIC_`. These must remain strictly isolated on the backend.

---

## 3. Step-by-Step Backend Deployment (Render)

### Step 1: Create a Web Service on Render
1. Log in to your [Render Dashboard](https://dashboard.render.com/).
2. Click **New +** -> **Web Service**.
3. Connect your GitHub repository: `Voice-Expression`.
4. Configure service parameters:
   - **Name**: `voice-expression-backend`
   - **Region**: Closest to your users (e.g., Singapore or Frankfurt or Oregon)
   - **Branch**: `main`
   - **Root Directory**: `backend` (or root if using Dockerfile)
   - **Runtime**: `Python 3`
   - **Build Command**:
     ```bash
     pip install -r requirements.txt
     ```
   - **Start Command**:
     ```bash
     uvicorn app.main:app --host 0.0.0.0 --port $PORT
     ```

### Step 2: Configure Environment Variables
In the Render Service **Environment** tab, add all required variables listed in Section 2.1.

### Step 3: Verify Health-Check Endpoint
Render will poll the health check endpoint:
- **Health Check Path**: `/health` (returns `200 OK`)

---

## 4. Step-by-Step Frontend Deployment (Vercel)

### Step 1: Import Project to Vercel
1. Log in to [Vercel](https://vercel.com/).
2. Click **Add New...** -> **Project**.
3. Select your GitHub repository: `Voice-Expression`.
4. In the Project Configuration:
   - **Framework Preset**: Next.js
   - **Root Directory**: Click edit and select `frontend`.
   - **Build Command**: `next build` (default)
   - **Output Directory**: `.next` (default)
   - **Install Command**: `npm install`

### Step 2: Add Environment Variables
Under the **Environment Variables** section, add:
- `NEXT_PUBLIC_API_URL` = `https://<your-render-app>.onrender.com/api/v1`
- `NEXT_PUBLIC_WS_URL` = `wss://<your-render-app>.onrender.com`

### Step 3: Deploy & Verify
Click **Deploy**. Upon build completion:
1. Verify the public URL (e.g., `https://voice-expression.vercel.app`).
2. Update the backend `ALLOWED_ORIGINS` setting on Render to include your Vercel production domain.

---

## 5. MongoDB Atlas Database Setup

1. Create a free M0 cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Under **Network Access**: Add IP Access List entries (whitelist Render's outbound IPs or allow `0.0.0.0/0` with strong password authentication).
3. Under **Database Access**: Create a database user with `readWriteAnyDatabase` privileges.
4. Retrieve connection string:
   ```text
   mongodb+srv://<username>:<password>@cluster0.abcde.mongodb.net/ai_manthan?retryWrites=true&w=majority
   ```
5. Paste this connection string into Render's `MONGODB_URI` environment variable.

---

## 6. Post-Deployment Verification Checklist

- [ ] **Health Endpoint**: `curl https://<backend>/health` returns `{"status": "ok", "database": "MongoDB Atlas"}`.
- [ ] **CORS Verification**: Opening frontend on `https://<frontend>` does not trigger CORS blocking in browser console.
- [ ] **WSS Connection**: Live gesture video streaming connects over `wss://<backend>/ws/gesture`.
- [ ] **Authentication**: Registering a test account generates JWT token stored in browser session.
- [ ] **Zero-Retention Camera**: WebCam stream unmounts and releases hardware device cleanly when navigating between pages.
- [ ] **WCAG Accessibility**: High-contrast mode and 130% text scaling render correctly across mobile and desktop viewports.

