def test_get_revision_dashboard(client):
    response = client.get("/api/dashboard/revision")
    assert response.status_code == 200
    data = response.json()
    assert "due_today" in data
    assert "retention_score" in data
    assert data["due_today"] == 5
