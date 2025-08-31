from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
import jwt
from sqlalchemy.orm import Session  # Add this import
from .config import settings
from .db import get_db_session
import uuid

# JWT settings
JWT_SECRET = settings.jwt_secret or "development_secret_key"
JWT_ALGORITHM = "HS256"
JWT_EXPIRY = 60 * 24 * 7  # 7 days in minutes

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_prefix}/auth/token")

# Initialize Supabase client conditionally
supabase = None
if settings.supabase_url and settings.supabase_service_key:
    try:
        from supabase import create_client, Client
        supabase: Optional[Client] = create_client(settings.supabase_url, settings.supabase_service_key)  # <-- CHANGED THIS LINE
    except Exception as e:
        print(f"Failed to initialize Supabase client: {e}")
        supabase = None

# Mock users for development
MOCK_USERS = {
    "user@example.com": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "email": "user@example.com",
        "password": "password123",  # In real app this would be hashed
        "name": "Test User"
    }
}

def create_access_token(data: Dict[str, Any]) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRY)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Check if we're using Supabase or local auth
    if supabase:
        try:
            # Print token for debugging (remove in production)
            print("Validating token:", token[:10] + "...")
            
            # For Supabase JWT, decode without verification first to examine structure
            # (this is only for debugging - we'll use Supabase's verification in production)
            try:
                payload = jwt.decode(token, options={"verify_signature": False})
                print("Token payload keys:", payload.keys())
            except Exception as e:
                print(f"Token examination failed: {e}")
            
            # Use Supabase's API to verify the token
            user = supabase.auth.get_user(token)
            
            # Extract correct user information
            return {
                "id": user.user.id,  # This should match the 'sub' in JWT
                "email": user.user.email
            }
        except Exception as e:
            print(f"Supabase auth error: {e}")
            raise credentials_exception
    else:
        # For local JWT auth, use your existing code
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("sub")
            email = payload.get("email")
            if user_id is None or email is None:
                raise credentials_exception
            return {"id": user_id, "email": email}
        except jwt.PyJWTError:
            raise credentials_exception