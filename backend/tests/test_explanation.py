def test_explanation_route(client, mock_groq_client):
    response = client.post(
        "/api/explanation",
        json={
            "question": "Explain quantum physics.",
            "correct_answer": "It is the study of matter and energy at the most fundamental level.",
            "difficulty": "easy"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "explanation" in data
    assert "key_takeaway" in data
    assert data["explanation"] == "Mocked explanation"
    assert data["key_takeaway"] == "Mocked takeaway"
