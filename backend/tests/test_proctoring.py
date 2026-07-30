import pytest

@pytest.mark.anyio
async def test_proctoring_log_tab_switch(client):
    response = await client.post(
        "/api/proctoring/log",
        json={
            "session_id": "test_tab_session",
            "event_type": "TAB_SWITCH",
            "details": "User switched tabs"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["event_type"] == "TAB_SWITCH"

@pytest.mark.anyio
async def test_proctoring_summary_tab_switch(client):
    # Log two tab switches
    await client.post(
        "/api/proctoring/log",
        json={
            "session_id": "test_summary_session",
            "event_type": "TAB_SWITCH",
            "details": "User switched tabs first time"
        }
    )
    await client.post(
        "/api/proctoring/log",
        json={
            "session_id": "test_summary_session",
            "event_type": "TAB_SWITCH",
            "details": "User switched tabs second time"
        }
    )

    response = await client.get("/api/proctoring/summary/test_summary_session")
    assert response.status_code == 200
    data = response.json()
    assert data["session_id"] == "test_summary_session"
    assert data["total_violations"] >= 2
    assert data["breakdown"].get("TAB_SWITCH", 0) >= 2
    assert data["is_locked"] == True
