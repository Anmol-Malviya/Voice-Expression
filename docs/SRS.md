# AI MANTHAN 2.0 - PROBLEM STATEMENT 16: SOFTWARE REQUIREMENTS SPECIFICATION
**Project Name**: Multimodal Live Conversation Assistant for People with Speech Impairments  
**Version**: 1.0.0 (Production-Ready Prototype)  
**Date**: October 2026  

## 1. Executive Summary
This application provides an accessible real-time communication platform empowering people with speech impairments (arising from ALS, Cerebral Palsy, Parkinson's Disease, Stroke, Laryngectomy, etc.) to engage in bidirectional live conversation. The system fuses incoming conversational speech, computer-vision gesture/lip cues, and context-aware LLM suggestions with an explicit user confirmation gate before speech synthesis.

## 2. Mandatory Capabilities
- **SRC-01**: Analyze speaker voice alongside visual cues (hand gestures, facial expressions, lip movement).
- **SRC-02**: Listen to the other conversation partner and transcribe speech in real-time.
- **SRC-03**: Fuse multimodal evidence to infer intended messages and generate rank-ordered replies.
- **SRC-04**: Synthesize confirmed messages using a natural, customizable voice (ElevenLabs + Web Speech fallback).
- **SRC-05**: Speech-to-text and text-to-speech integration.
- **SRC-06**: Multilingual support for English, Hindi, and Hinglish.
- **SRC-07**: Strict voice cloning consent controls with instant revocation.
- **SRC-08 to SRC-13**: Transparent fallback for uncalibrated signals, latency instrumentation targeting < 2.0s, and measured evaluation metrics.

## 3. Core Interaction Flow & Non-Negotiable Guardrails
1. **User Agency**: The AI only proposes candidates; the user retains full agency to confirm, edit, reject, or cancel. The system NEVER autonomously synthesizes unconfirmed text.
2. **Privacy First**: Raw video frames and raw audio are processed in memory and client-side by default without persistent storage unless explicitly consented.
3. **Graceful Fallbacks**: If camera, microphone, or external APIs fail, full functionality remains via accessible touch/keyboard controls and browser-native engines.

