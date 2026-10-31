# Antigravity Multi-Agent Orchestration & Protocol (AGENTS.md)

## Agent Role & Mission
This repository implements the assistive platform for **AI Manthan 2.0 (Problem Statement 16)**. All coding agents operating on this repository must comply with the following architectural constraints:

1. **User Agency Preserved**: Never implement auto-speaking AI candidates. A human confirmation action (`confirm` or `edit`) is always strictly required before triggering TTS.
2. **Privacy Defaults**: Never store raw camera video or audio recordings to disk without explicit patient consent. Process MediaPipe vision landmarks in ephemeral memory.
3. **Voice Cloning Consent Guard**: Always verify active consent in `voice_consents` collection before producing cloned speech audio.
4. **Resilient Local Fallback**: Never crash or raise 500 when external cloud API keys (MongoDB Atlas, ElevenLabs, Gemini) are unconfigured. Use the local async memory database and browser speech synthesis fallback.
5. **Accessibility Integrity**: Maintain WCAG AAA contrast ratios, keyboard tab traversal, large touch targets (> 52px), and ARIA landmark regions.

