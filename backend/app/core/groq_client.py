from groq import AsyncGroq
from app.core.config import config
import httpx
import os

class GroqClient:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(GroqClient, cls).__new__(cls)
            # Disable SSL verification for development (Windows certificate issues)
            # For production, use proper certificate handling
            cls._instance.client = AsyncGroq(
                api_key=config.GROQ_API_KEY,
                http_client=httpx.AsyncClient(verify=False)
            )
        return cls._instance

def get_groq_client() -> AsyncGroq:
    """
    Returns a singleton instance of the AsyncGroq client.
    """
    return GroqClient().client

