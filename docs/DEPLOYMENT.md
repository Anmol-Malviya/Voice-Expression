# Production Deployment Guide

## Architecture Overview
- **Frontend**: Single Page Application (SPA) / React + Vite static bundle deployed to Vercel, Netlify, or AWS S3 + CloudFront with HTTPS enabled (HTTPS is required for microphone and camera permissions in browsers).
- **Backend**: Containerized FastAPI service running on Railway, Render, Fly.io, or AWS ECS with persistent environment variables and WebSocket support.
- **Database**: MongoDB Atlas Cluster M0/M10 with IP access lists and dedicated database user with read/write privileges on `ai_manthan`.

## Environment Checklist
1. `MONGODB_URI`: Connection string to MongoDB Atlas.
2. `JWT_SECRET`: 64-character cryptographically random secret.
3. `ELEVENLABS_API_KEY`: ElevenLabs API key with Scribe and Multilingual v2 models enabled.
4. `GEMINI_API_KEY`: Google Gemini API key for structured intent candidate ranking.
5. `ALLOWED_ORIGINS`: Production frontend origin (e.g. `https://voice-expression.vercel.app`).

