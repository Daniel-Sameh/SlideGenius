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

    # LLM settings
    groq_api_key: str = os.getenv("GROQ_API_KEY", "")
    use_mock_llm: bool = not bool(os.getenv("GROQ_API_KEY"))

    # CORS
    allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "http://localhost:8080")
    # Parse the comma-separated string into a list
    allowed_origins: List[str] = [o.strip().strip('"').strip("'") for o in allowed_origins_str.split(',') if o.strip()]
                                 #allowed_origins_str.split(',')

settings = Settings()