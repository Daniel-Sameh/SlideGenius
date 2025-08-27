# backend/app/config.py
import os
import json
from typing import List
from pathlib import Path
from dotenv import load_dotenv

# Get the absolute path to the .env file
env_path = Path(__file__).parent / '.env'
# Load environment variables from .env file
load_dotenv(dotenv_path=env_path)

# Print loaded variables for debugging (remove in production)
print(f"SUPABASE_URL from env: {os.getenv('SUPABASE_URL')}")

class Settings:
    app_name: str = "SlideGenius Backend"
    api_prefix: str = "/api"
    environment: str = "development"

    # Load from environment variables
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_key: str = os.getenv("SUPABASE_ANON_KEY", "")
    supabase_service_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    jwt_secret: str = os.getenv("SUPABASE_JWT_SECRET", "secure_development_key")
    
    # Database
    database_url: str = os.getenv("DATABASE_URL", "")

    # HuggingFace settings
    hf_api_key: str = os.getenv("HF_API_TOKEN", "")
    hf_model_id: str = os.getenv("HF_MODEL_ID", "mistralai/Mistral-7B-Instruct-v0.2")
    llm_temperature: float = float(os.getenv("LLM_TEMPERATURE", "0.2"))
    use_mock_llm: bool = False

    # CORS
    allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:8080")
    # Parse the comma-separated string into a list
    allowed_origins: List[str] = allowed_origins_str.split(',')

settings = Settings()