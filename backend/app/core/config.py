import os
from typing import Optional

from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

# Load the backend .env regardless of the process working directory.
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
load_dotenv(os.path.join(BACKEND_DIR, ".env"))
load_dotenv()

# Default DB file lives next to the backend package, anchored to an absolute
# path so it doesn't matter what directory the server is launched from.
_DEFAULT_DB_PATH = os.path.join(BACKEND_DIR, "sql_app.db").replace("\\", "/")
_DEFAULT_DATABASE_URL = f"sqlite:///{_DEFAULT_DB_PATH}"

class Settings(BaseSettings):
    # API Config
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "Adaptive Quiz Engine"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "supersecretkey_change_in_production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7 # 7 days
    
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", _DEFAULT_DATABASE_URL)
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    
    # Groq LLM
    GROQ_API_KEY: str = os.getenv("GROQ_API_KEY", "")
    GROQ_MODEL: str = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")

    model_config = SettingsConfigDict(case_sensitive=True)

settings = Settings()
# Alias for compatibility with agents that import `config`
config = settings


def resolve_groq_api_key(explicit_key: Optional[str] = None) -> Optional[str]:
    """Prefer an explicit per-request API key over the configured GROQ_API_KEY.

    Used consistently across every endpoint that calls Groq directly, so all of
    them support the same optional per-request override behavior.
    """
    return explicit_key or settings.GROQ_API_KEY or None
