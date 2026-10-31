# Testing Strategy & Benchmark Plan

## Test Matrix
1. **Unit & API Integration Tests**:
   - Authentication (Registration, Login, Token validation, Password hashing).
   - Session Lifecycle (Create, Retrieve, Update, End, Delete).
   - Message Persistence & Retrieval.
   - Multimodal Inference Pipeline (Audio + Gesture Fusion).
   - Confirmation Gate Enforcement (verify speech is blocked prior to confirmation).
   - Voice Consent Lifecycle (Active -> Revoked -> Blocked).
   - Accessibility & Preferences API.

2. **Frontend Accessibility & E2E Verification**:
   - Keyboard Tab Navigation & Focus Rings.
   - High Contrast color ratios (WCAG AAA compliant: > 7:1 for text).
   - Screen Reader ARIA roles and live regions (`aria-live="polite"` for transcript).
   - Responsive design on 320px mobile to 1920px desktop viewports.
   - Speech synthesis and speech recognition error recovery.

3. **Performance & Latency Instrumentation**:
   - Target end-to-end latency: < 2.0s from input capture to reply proposal.
   - Metrics reporting: Median p50 and 95th percentile p95.
   - Word Error Rate (WER) logging on benchmark datasets.

