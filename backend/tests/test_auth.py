import pytest
from httpx import AsyncClient, ASGITransport
from backend.app.main import app

@pytest.mark.asyncio
async def test_health_check():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        response = await ac.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app"] == "VoiceExpression"

@pytest.mark.asyncio
async def test_user_registration_and_login():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        # 1. Register new user
        reg_payload = {
            "name": "Sarah Connor",
            "email": "sarah@example.com",
            "password": "strongPassword123",
            "preferred_language": "en"
        }
        reg_resp = await ac.post("/api/auth/register", json=reg_payload)
        assert reg_resp.status_code in [201, 400] # 201 created or 400 if already exists

        # 2. Login
        login_payload = {
            "email": "sarah@example.com",
            "password": "strongPassword123"
        }
        login_resp = await ac.post("/api/auth/login", json=login_payload)
        assert login_resp.status_code == 200
        data = login_resp.json()
        assert "access_token" in data
        assert data["user"]["email"] == "sarah@example.com"
        token = data["access_token"]

        # 3. Access authenticated profile
        me_resp = await ac.get("/api/users/me", headers={"Authorization": f"Bearer {token}"})
        assert me_resp.status_code == 200
        assert me_resp.json()["name"] == "Sarah Connor"

