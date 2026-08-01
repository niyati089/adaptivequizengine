import pytest

def test_quiz_submit_incorrect(client):
    response = client.post(
        "/api/quiz/submit",
        json={
            "theta": 0.0,
            "difficulty": 0.0,
            "selected_option": "B",
            "correct_answer": "A",
            "topic": "Computer Science",
            "subtopic": "Introduction",
            "question": "What is 1 + 1?",
            "misconception": "Adding error"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["correct"] is False
    assert data["new_theta"] < 0.0  # theta should decrease

def test_quiz_submit_correct(client):
    response = client.post(
        "/api/quiz/submit",
        json={
            "theta": 0.0,
            "difficulty": 0.0,
            "selected_option": "A",
            "correct_answer": "A",
            "topic": "Computer Science",
            "subtopic": "Introduction",
            "question": "What is 1 + 1?"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["correct"] is True
    assert data["new_theta"] > 0.0  # theta should increase

from unittest.mock import MagicMock, AsyncMock, patch

def test_quiz_generate_basic(client):
    mock_groq_instance = MagicMock()
    mock_message = MagicMock()
    mock_message.choices = [
        MagicMock(message=MagicMock(content='{"question": "What is 2+2?", "options": {"A": "3", "B": "4", "C": "5", "D": "6"}, "correct_answer": "B", "explanation": "4 is correct", "difficulty": 0.5, "bloom_level": "Apply", "misconceptions": {"A": "off by one"}}'))
    ]
    mock_groq_instance.chat.completions.create.return_value = mock_message

    with patch("app.api.endpoints.quiz.Groq", return_value=mock_groq_instance):
        response = client.post(
            "/api/quiz/generate",
            json={
                "topic": "Math",
                "subtopic": "Addition",
                "difficulty": 0.5,
                "bloom_level": "Apply",
                "previous_questions": [],
                "api_key": "fake_key",
                "enable_anti_cheating": False
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["question"] == "What is 2+2?"
        assert data["is_variant"] == False

def test_quiz_generate_variant(client):
    mock_groq_instance = MagicMock()
    mock_message = MagicMock()
    mock_message.choices = [
        MagicMock(message=MagicMock(content='{"question": "What is 2+2?", "options": {"A": "3", "B": "4", "C": "5", "D": "6"}, "correct_answer": "B", "explanation": "4 is correct", "difficulty": 0.5, "bloom_level": "Apply", "misconceptions": {"A": "off by one"}}'))
    ]
    mock_groq_instance.chat.completions.create.return_value = mock_message

    mock_variant = {
        "question": "If you have 2 apples and get 2 more, how many do you have?",
        "options": {"A": "3", "B": "4", "C": "5", "D": "6"},
        "correct_answer": "B",
        "explanation": "4 apples",
        "difficulty": 0.5,
        "bloom_level": "Apply",
        "misconceptions": {"A": "off by one"},
        "is_variant": True
    }

    with patch("app.api.endpoints.quiz.Groq", return_value=mock_groq_instance), \
         patch("app.agents.question_gen.QuestionGenerationAgent.generate_variant", new_callable=AsyncMock) as mock_gen_variant:
        
        mock_gen_variant.return_value = mock_variant

        response = client.post(
            "/api/quiz/generate",
            json={
                "topic": "Math",
                "subtopic": "Addition",
                "difficulty": 0.5,
                "bloom_level": "Apply",
                "previous_questions": [],
                "api_key": "fake_key",
                "enable_anti_cheating": True
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["question"] == "If you have 2 apples and get 2 more, how many do you have?"
        assert data["is_variant"] == True
