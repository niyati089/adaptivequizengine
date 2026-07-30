from groq import AsyncGroq
from app.core.config import config

class GroqClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GroqClient, cls).__new__(cls)
            cls._instance.client = AsyncGroq(
                api_key=config.GROQ_API_KEY
            )
        return cls._instance

def get_groq_client() -> AsyncGroq:
    """
    Returns a singleton instance of the AsyncGroq client.
    """
    return GroqClient().client

