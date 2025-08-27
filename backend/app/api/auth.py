from fastapi import APIRouter, HTTPException, Depends, status, Response
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from ..config import settings
from ..db import get_db_session
import jwt
from datetime import datetime, timedelta
import uuid
from typing import Optional
from pydantic import BaseModel

router = APIRouter(tags=["Authentication"])

# Debug information
print(f"Auth setup - Supabase URL: {settings.supabase_url}")
print(f"Auth setup - Using Supabase: {bool(settings.supabase_url and settings.supabase_key)}")

# JWT settings
JWT_SECRET = settings.jwt_secret or "development_secret_key"
JWT_ALGORITHM = "HS256"
JWT_EXPIRY = 60 * 24 * 7  # 7 days in minutes

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.api_prefix}/auth/token")

# Mock users for development
MOCK_USERS = {
    "user@example.com": {
        "id": "123e4567-e89b-12d3-a456-426614174000",
        "email": "user@example.com",
        "password": "password123",  # In real app this would be hashed
        "name": "Test User"
    }
}

# Try to initialize Supabase client
supabase = None
if settings.supabase_url and settings.supabase_key:
    try:
        from supabase import create_client
        supabase = create_client(settings.supabase_url, settings.supabase_key)
        print("Supabase client initialized successfully")
    except Exception as e:
        print(f"Failed to initialize Supabase client: {e}")
        supabase = None

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRY)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("sub")
        email = payload.get("email")
        
        if not user_id or not email:
            raise HTTPException(status_code=401, detail="Invalid token")
            
        return {"id": user_id, "email": email}
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

# Add a proper request model
class UserRegistration(BaseModel):
    email: str
    password: str
    name: str

@router.post("/auth/register")
async def register(user_data: UserRegistration):
    if not supabase:
        # Mock implementation for development
        if user_data.email in MOCK_USERS:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        user_id = str(uuid.uuid4())
        MOCK_USERS[user_data.email] = {
            "id": user_id,
            "email": user_data.email,
            "password": user_data.password,  # Would be hashed in production
            "name": user_data.name
        }
        
        return {
            "id": user_id,
            "email": user_data.email,
            "name": user_data.name,
            "access_token": create_access_token({"sub": user_id, "email": user_data.email})
        }
    else:
        # Real Supabase implementation
        try:
            # Fix: Properly structure the sign_up request
            auth_response = supabase.auth.sign_up({
                "email": user_data.email,
                "password": user_data.password,
                "options": {
                    "data": {
                        "name": user_data.name  # This ensures name is saved in user_metadata
                    }
                }
            })
            
            # Return a more consistent response
            return {
                "id": auth_response.user.id,
                "email": auth_response.user.email,
                "name": user_data.name,
                "access_token": auth_response.session.access_token if auth_response.session else None
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=str(e))

@router.post("/auth/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    if not supabase:
        # Mock implementation
        user = MOCK_USERS.get(form_data.username)
        if not user or user["password"] != form_data.password:
            raise HTTPException(status_code=401, detail="Incorrect email or password")
        
        return {
            "access_token": create_access_token({"sub": user["id"], "email": user["email"]}),
            "token_type": "bearer"
        }
    else:
        # Real Supabase implementation
        try:
            response = supabase.auth.sign_in_with_password({
                "email": form_data.username,
                "password": form_data.password
            })
            return {
                "access_token": response.session.access_token,
                "token_type": "bearer"
            }
        except Exception as e:
            raise HTTPException(status_code=401, detail="Incorrect email or password")

@router.get("/auth/me")
async def get_me(current_user = Depends(get_current_user)):
    return current_user