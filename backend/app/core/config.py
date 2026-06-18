import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

config = Config()
