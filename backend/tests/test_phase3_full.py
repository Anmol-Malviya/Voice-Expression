import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_database_connection_and_health():
    """1. Test Database connection and health status endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "database" in data
    assert "ai_manthan" in data["database"] or "MongoDB Atlas" in data["database"]

def test_user_registration_and_duplicate():
    """2 & 3. Test user registration and duplicate email handling."""
    unique_email = f"test_user_{id(object())}@example.com"
    payload = {
        "name": "Sarah Connor",
        "email": unique_email,
        "password": "strongPassword123",
        "preferred_language": "en",
        "accessibility_settings": {
            "font_size": "large",
            "high_contrast": True,
        }
    }
    
    # 2. Registration Success
    res = client.post("/api/v1/auth/register", json=payload)
    assert res.status_code == 201
    data = res.json()
    assert data["success"] is True
    assert "access_token" in data
    assert data["user"]["email"] == unique_email
    assert "password_hash" not in data["user"]  # Never expose password hash!

    # 3. Duplicate Registration Failure
    dup_res = client.post("/api/v1/auth/register", json=payload)
    assert dup_res.status_code == 400
    dup_data = dup_res.json()
    assert dup_data["success"] is False

def test_login_success_and_failure():
    """4 & 5. Test login with correct and incorrect credentials."""
    email = f"login_test_{id(object())}@example.com"
    password = "validPassword123"

    # Register first
    client.post("/api/v1/auth/register", json={
        "name": "Login Tester",
        "email": email,
        "password": password,
    })

    # 4. Login Success
    res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": password,
    })
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert "access_token" in data
    assert data["user"]["email"] == email

    # 5. Login Failure (Wrong password)
    fail_res = client.post("/api/v1/auth/login", json={
        "email": email,
        "password": "wrongPassword!",
    })
    assert fail_res.status_code == 401
    fail_data = fail_res.json()
    assert fail_data["success"] is False

def test_invalid_tokens_and_unauthorized_access():
    """6 & 14. Test invalid tokens and unauthorized access guards."""
    # 14. Missing token
    res1 = client.get("/api/v1/users/me")
    assert res1.status_code == 401
    assert res1.json()["success"] is False

    # 6. Invalid token
    headers = {"Authorization": "Bearer invalid.jwt.token"}
    res2 = client.get("/api/v1/users/me", headers=headers)
    assert res2.status_code == 401
    assert res2.json()["success"] is False

def test_user_profile_retrieval_and_update():
    """7. Test user profile retrieval and patch updates."""
    email = f"profile_{id(object())}@example.com"
    reg = client.post("/api/v1/auth/register", json={
        "name": "Original Name",
        "email": email,
        "password": "password123",
    })
    token = reg.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Retrieve profile
    get_res = client.get("/api/v1/users/me", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Original Name"

    # Patch profile
    patch_res = client.patch("/api/v1/users/me", json={
        "name": "Updated Name",
        "preferred_language": "hi",
    }, headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["name"] == "Updated Name"
    assert patch_res.json()["preferred_language"] == "hi"

def test_conversation_lifecycle_and_ownership():
    """8 & 9. Test conversation creation and cross-user ownership isolation."""
    # User A
    user_a = client.post("/api/v1/auth/register", json={
        "name": "User A",
        "email": f"usera_{id(object())}@example.com",
        "password": "password123",
    }).json()
    headers_a = {"Authorization": f"Bearer {user_a['access_token']}"}

    # User B
    user_b = client.post("/api/v1/auth/register", json={
        "name": "User B",
        "email": f"userb_{id(object())}@example.com",
        "password": "password123",
    }).json()
    headers_b = {"Authorization": f"Bearer {user_b['access_token']}"}

    # 8. User A creates conversation
    conv_res = client.post("/api/v1/conversations", json={
        "title": "Therapy Session A",
        "language": "en",
    }, headers=headers_a)
    assert conv_res.status_code == 201
    conv = conv_res.json()
    conv_id = conv["id"]

    # 9. User B tries to access User A's conversation -> 403 Forbidden
    cross_res = client.get(f"/api/v1/conversations/{conv_id}", headers=headers_b)
    assert cross_res.status_code == 403
    assert cross_res.json()["success"] is False

    # User A lists conversations -> only sees their own
    list_res = client.get("/api/v1/conversations", headers=headers_a)
    assert list_res.status_code == 200
    conv_ids = [c["id"] for c in list_res.json()["data"]]
    assert conv_id in conv_ids

    # User B lists conversations -> empty or does not contain conv_id
    list_b = client.get("/api/v1/conversations", headers=headers_b)
    b_ids = [c["id"] for c in list_b.json()["data"]]
    assert conv_id not in b_ids

def test_messages_creation_retrieval_and_cascade_delete():
    """10 & 11. Test message creation, retrieval, and cascading deletion on conversation delete."""
    reg = client.post("/api/v1/auth/register", json={
        "name": "Message Tester",
        "email": f"msg_tester_{id(object())}@example.com",
        "password": "password123",
    }).json()
    headers = {"Authorization": f"Bearer {reg['access_token']}"}

    # Create conversation
    conv = client.post("/api/v1/conversations", json={"title": "Message Chat"}, headers=headers).json()
    conv_id = conv["id"]

    # 10. Create Message
    msg_res = client.post("/api/v1/messages", json={
        "conversation_id": conv_id,
        "sender": "partner",
        "message_type": "speech_transcription",
        "text": "Are you ready to begin therapy?",
    }, headers=headers)
    assert msg_res.status_code == 201
    msg_data = msg_res.json()
    assert msg_data["text"] == "Are you ready to begin therapy?"
    assert msg_data["sender"] == "partner"

    # User assistive response
    client.post("/api/v1/messages", json={
        "conversation_id": conv_id,
        "sender": "user",
        "message_type": "tts_spoken",
        "text": "Yes, I am feeling ready.",
        "fusedSignals": ["Head Nod (Affirmation)"],
    }, headers=headers)

    # 11. Retrieve Messages
    get_msgs = client.get(f"/api/v1/conversations/{conv_id}/messages", headers=headers)
    assert get_msgs.status_code == 200
    msgs = get_msgs.json()["data"]
    assert len(msgs) == 2
    assert msgs[0]["text"] == "Are you ready to begin therapy?"
    assert msgs[1]["text"] == "Yes, I am feeling ready."

    # Delete Conversation -> Cascade delete messages
    del_conv = client.delete(f"/api/v1/conversations/{conv_id}", headers=headers)
    assert del_conv.status_code == 200

    # Verification of deletion
    check_conv = client.get(f"/api/v1/conversations/{conv_id}", headers=headers)
    assert check_conv.status_code == 404

def test_user_preferences_updates():
    """12. Test getting and updating user preferences."""
    reg = client.post("/api/v1/auth/register", json={
        "name": "Pref Tester",
        "email": f"pref_tester_{id(object())}@example.com",
        "password": "password123",
    }).json()
    headers = {"Authorization": f"Bearer {reg['access_token']}"}

    # Get initial preferences
    get_res = client.get("/api/v1/preferences", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["data"]["speech_speed"] == 1.0

    # Update preferences
    put_res = client.put("/api/v1/preferences", json={
        "speech_speed": 1.2,
        "volume": 0.85,
        "high_contrast": True,
        "text_size": "xlarge",
        "preferred_language": "hi",
    }, headers=headers)
    assert put_res.status_code == 200
    updated = put_res.json()["data"]
    assert updated["speech_speed"] == 1.2
    assert updated["high_contrast"] is True
    assert updated["text_size"] == "xlarge"

def test_quick_phrases_crud():
    """13. Test Quick Phrases CRUD operations."""
    reg = client.post("/api/v1/auth/register", json={
        "name": "Phrase Tester",
        "email": f"phrase_tester_{id(object())}@example.com",
        "password": "password123",
    }).json()
    headers = {"Authorization": f"Bearer {reg['access_token']}"}

    # List system phrases
    list_res = client.get("/api/v1/phrases", headers=headers)
    assert list_res.status_code == 200
    res_data = list_res.json()
    phrases = res_data.get("data", res_data) if isinstance(res_data, dict) else res_data
    assert len(phrases) >= 10  # Contains default phrases

    # Create custom phrase
    create_res = client.post("/api/v1/phrases", json={
        "phrase": "Please turn on the fan.",
        "category": "Needs",
    }, headers=headers)
    assert create_res.status_code == 201
    phrase_id = create_res.json()["id"]

    # Update custom phrase
    patch_res = client.patch(f"/api/v1/phrases/{phrase_id}", json={
        "phrase": "Please turn on the AC.",
    }, headers=headers)
    assert patch_res.status_code == 200
    assert patch_res.json()["phrase"] == "Please turn on the AC."

    # Delete custom phrase
    del_res = client.delete(f"/api/v1/phrases/{phrase_id}", headers=headers)
    assert del_res.status_code in [200, 204]
