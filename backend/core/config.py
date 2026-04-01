import os
from dotenv import load_dotenv

load_dotenv(override=True)

class Settings:
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    GEMINI_MODEL: str = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    MAX_CONCURRENT_LLM: int = int(os.getenv("MAX_CONCURRENT_LLM", "2"))
    BATCH_SIZE: int = int(os.getenv("BATCH_SIZE", "5"))
    CACHE_TTL: int = int(os.getenv("CACHE_TTL", "86400"))
    DB_PATH: str = os.getenv("DB_PATH", "./recruitment.db")

settings = Settings()
