# VoiceExpression REST API Specification

**Base URL**: `http://localhost:8000/api/v1` (also mounted on `/api`)  
**Interactive Swagger UI**: `http://localhost:8000/docs`  
**ReDoc Documentation**: `http://localhost:8000/redoc`

---

## 1. Standard Response Formats

### Success Envelope
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {}
}
```

### Error Envelope
```json
{
  "success": false,
  "message": "Error description",
  "detail": {}
}
```

---

## 2. Authentication Endpoints

### Register User
- **Method**: `POST`
- **Path**: `/auth/register`
- **Request Body**:
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex@example.com",
    "password": "strongPassword123",
    "preferred_language": "en",
    "accessibility_settings": {
      "font_size": "large",
      "high_contrast": false
    }
  }
  ```
- **Status**: `201 Created`

### Login
- **Method**: `POST`
- **Path**: `/auth/login`
- **Request Body**:
  ```json
  {
    "email": "alex@example.com",
    "password": "strongPassword123"
  }
  ```
- **Response**: Returns JWT `access_token` and sanitized `user` object.

### Current User Profile
- **Method**: `GET`
- **Path**: `/auth/me` and `/users/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**: Authenticated user profile without password hash.

---

## 3. User Management

### Update Profile
- **Method**: `PATCH` / `PUT`
- **Path**: `/users/me`
- **Request Body**:
  ```json
  {
    "name": "Alex Mercer",
    "preferred_language": "hi",
    "accessibility_settings": {
      "font_size": "xlarge",
      "high_contrast": true
    }
  }
  ```

---

## 4. Conversations Endpoints

### Create Conversation
- **Method**: `POST`
- **Path**: `/conversations` (alias `/sessions`)
- **Request Body**:
  ```json
  {
    "title": "Therapy Session",
    "language": "en",
    "mode": "live_conversation"
  }
  ```

### List Conversations
- **Method**: `GET`
- **Path**: `/conversations` (alias `/sessions`)
- **Query Params**: `skip=0`, `limit=50`
- **Response**: List of user-owned conversation summaries.

### Get Conversation Details
- **Method**: `GET`
- **Path**: `/conversations/{conversation_id}`

### End Conversation
- **Method**: `POST`
- **Path**: `/conversations/{conversation_id}/end`

### Delete Conversation
- **Method**: `DELETE`
- **Path**: `/conversations/{conversation_id}`
- **Behavior**: Permanently deletes conversation record and cascades deletion to all messages (FR-016 privacy compliance).

---

## 5. Messages Endpoints

### Post Message
- **Method**: `POST`
- **Path**: `/messages`
- **Request Body**:
  ```json
  {
    "conversation_id": "sess_101",
    "sender": "partner",
    "message_type": "speech_transcription",
    "text": "How are you feeling today?",
    "fusedSignals": ["Head Nod"]
  }
  ```

### Retrieve Conversation Messages
- **Method**: `GET`
- **Path**: `/conversations/{conversation_id}/messages`

---

## 6. Preferences Endpoints

### Get Preferences
- **Method**: `GET`
- **Path**: `/preferences`

### Update Preferences
- **Method**: `PUT` / `PATCH`
- **Path**: `/preferences`
- **Request Body**:
  ```json
  {
    "speech_speed": 1.1,
    "volume": 0.9,
    "text_size": "large",
    "high_contrast": false
  }
  ```

---

## 7. Quick Phrases Endpoints

### List Phrases
- **Method**: `GET`
- **Path**: `/phrases`
- **Query Params**: `category=Needs` (optional)

### Create Phrase
- **Method**: `POST`
- **Path**: `/phrases`
- **Request Body**:
  ```json
  {
    "phrase": "Please adjust my pillow.",
    "category": "Needs",
    "language": "en"
  }
  ```

### Delete Phrase
- **Method**: `DELETE`
- **Path**: `/phrases/{phrase_id}`
- **Status**: `204 No Content`

---

## 8. Multimodal Gesture Recognition Endpoints

### Recognize Gesture (Full Pipeline)
- **Method**: `POST`
- **Path**: `/api/v1/gesture/recognize`
- **Request Body**:
  ```json
  {
    "image_data": "data:image/jpeg;base64,...",
    "landmarks": null,
    "gesture_name": null,
    "generate_suggestions": true
  }
  ```
- **Response**: `GestureRecognizeResponse` with `label`, `confidence`, `suggested_text`, `ai_suggestions`, `status`, `is_dynamic`, `landmark_count`.

### Classify Landmarks
- **Method**: `POST`
- **Path**: `/api/v1/gesture/classify`
- **Request Body**:
  ```json
  {
    "landmarks": [
      {"x": 0.5, "y": 0.8, "z": 0.0},
      ...
    ]
  }
  ```

### Get Gesture Vocabulary
- **Method**: `GET`
- **Path**: `/api/v1/gesture/vocabulary`
- **Response**: List of 8 core vocabulary items (`open_palm`, `closed_fist`, `thumbs_up`, `thumbs_down`, `pointing`, `peace_sign`, `stop_gesture`, `wave`) with default & active phrases.

### Update Custom Mappings
- **Method**: `PUT`
- **Path**: `/api/v1/gesture/mappings`
- **Request Body**:
  ```json
  {
    "mappings": {
      "open_palm": "Hello, good to see you.",
      "pointing": "I need some water, please."
    }
  }
  ```

### Ephemeral Gesture History
- **Method**: `GET`
- **Path**: `/api/v1/gesture/history`

### Real-Time WebSocket
- **Protocol**: `WS`
- **Path**: `/ws/gesture` (also `/api/v1/gesture/ws`)
- **Message Types**:
  - `{"type": "frame", "image": "data:image/jpeg;base64,..."}`
  - `{"type": "landmarks", "landmarks": [...]}`
  - `{"type": "ping"}`


