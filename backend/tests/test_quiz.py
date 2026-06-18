def test_quiz_submit_high_confidence_incorrect(client, mock_groq_client):
    response = client.post(
        "/api/quiz/submit",
        json={
            "question_id": 1,
            "selected_option": "Wrong Answer",
            "time_taken_ms": 1500,
            "confidence": 5
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["correct"] == False
    assert data["feedback_mode"] == "socratic"
    assert data["hint"] == "Mocked Hint or True"

def test_quiz_submit_correct(client):
    response = client.post(
        "/api/quiz/submit",
        json={
            "question_id": 1,
            "selected_option": "Paris",  # the mock correct answer in service
            "time_taken_ms": 1500,
            "confidence": 5
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["correct"] == True
    assert data["feedback_mode"] == "normal"
