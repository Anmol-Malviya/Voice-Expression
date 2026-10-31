# Quick Start & Setup Guide

## System Requirements
- Node.js >= 18.0.0 (Tested on Node.js v24)
- Python >= 3.10 (Tested on Python 3.14)
- Modern Web Browser (Google Chrome, Microsoft Edge, Brave, or Safari) with microphone and webcam permissions enabled.

---

## 1. Backend Setup

```bash
# Navigate to backend folder
cd backend

# Create and activate virtual environment
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run the FastAPI server
python -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`

---

## 2. Frontend Setup

```bash
# Navigate to frontend folder
cd frontend

# Install dependencies
npm install

# Run Vite development server
npm run dev
```
Accessible UI will be live at: `http://localhost:5173`

---

## 3. Running Automated Tests

```bash
# From workspace root
.\backend\venv\Scripts\python.exe -m pytest backend\tests -v
```

---

## 4. Environment Variables Configuration

Copy `.env.example` to `.env`:
```bash
# Backend .env
APP_ENV=development
APP_PORT=8000
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# Optional Cloud API keys (offline local fallbacks run out-of-the-box if left blank)
MONGODB_URI=
ELEVENLABS_API_KEY=
GEMINI_API_KEY=
```

