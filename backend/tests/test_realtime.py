import pytest
from app.core.security import create_access_token

def test_websocket_accepts_valid_jwt(client):
    # Use existing user
    token = create_access_token({"sub": "testadmin"})
    
    with client.websocket_connect(f"/ws?token={token}") as websocket:
        websocket.send_text("ping")
        data = websocket.receive_text()
        assert data == "pong"

def test_websocket_rejects_invalid_jwt(client):
    token = "invalid.token.here"
    with pytest.raises(Exception):
        with client.websocket_connect(f"/ws?token={token}") as websocket:
            websocket.send_text("ping")
            websocket.receive_text()

# Other tests like Redis event publication would require mocking Redis.
# For this phase, these basic connection tests prove the WS endpoint works.
