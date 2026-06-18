from openai import AsyncOpenAI
from app.core.config import config

class GroqClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GroqClient, cls).__new__(cls)
            cls._instance.client = AsyncOpenAI(
                api_key=config.GROQ_API_KEY,
                base_url="https://api.groq.com/openai/v1"
            )
        return cls._instance

def get_groq_client() -> AsyncOpenAI:
    """
    Returns a singleton instance of the AsyncOpenAI client configured for Groq.
    """
    return GroqClient().client
