def test_socratic_hint(client, mock_groq_client):
    response = client.post(
        "/api/socratic",
        json={
            "question": "What is 2+2?",
            "user_answer": "5",
            "correct_answer": "4",
            "confidence": 5
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["mode"] == "socratic"
    assert data["hint"] == "Mocked Hint or True"
