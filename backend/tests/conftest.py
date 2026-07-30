import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app

@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop()
    yield loop
    loop.close()

import httpx

@pytest.fixture
async def client():
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as c:
        yield c

@pytest.fixture(autouse=True)
def mock_groq_client():
    with patch("app.agents.socratic_agent.SocraticAgent.generate_hint", new_callable=AsyncMock) as mock_socratic, \
         patch("app.agents.explanation_agent.ExplanationAgent.generate_explanation", new_callable=AsyncMock) as mock_explanation, \
         patch("app.agents.question_gen.QuestionGenerationAgent.generate", new_callable=AsyncMock) as mock_question, \
         patch("app.agents.verification.VerificationAgent.verify", new_callable=AsyncMock) as mock_verify:
         
        mock_socratic.return_value = "Mocked Hint or True"
        mock_explanation.return_value = {
            "explanation": "Mocked explanation",
            "key_takeaway": "Mocked takeaway"
        }
        mock_question.return_value = {
            "question": "Mock?",
            "options": ["A", "B"],
            "correct_answer": "A"
        }
        mock_verify.return_value = True
        
        yield
