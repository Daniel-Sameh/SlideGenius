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
print(f"Auth setup - Using Supabase: {bool(settings.supabase_url and settings.supabase_service_key)}")

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
if settings.supabase_url and settings.supabase_service_key: # Check for the SERVICE key
    try:
        from supabase import create_client
        # THE FIX: Initialize the client with the SERVICE_ROLE_KEY
        supabase = create_client(settings.supabase_url, settings.supabase_service_key)
        print("Supabase client initialized successfully with SERVICE ROLE.")
    except Exception as e:
        print(f"Failed to initialize Supabase client: {e}")
        supabase = None

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=JWT_EXPIRY)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(token: str = Depends(oauth2_scheme)):
    print(f"get_current_user called with token: {token[:20]}...")
    print(f"supabase is None: {supabase is None}")
    
    if not supabase:
        # Fallback to mock user logic if Supabase isn't configured
        print("Using mock auth")
        try:
            payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            user_id = payload.get("sub")
            email = payload.get("email")
            print(f"Decoded payload: user_id={user_id}, email={email}")
            if not user_id or not email:
                raise HTTPException(status_code=401, detail="Invalid token")
            return {"id": user_id, "email": email}
        except jwt.PyJWTError as e:
            print(f"JWT decode error: {e}")
            raise HTTPException(status_code=401, detail="Invalid token")

    # The correct way: Validate the token with Supabase
    print("Using Supabase auth")
    try:
        user_response = supabase.auth.get_user(token)
        user = user_response.user
        if not user:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
        
        # Return a consistent user object
        return {"id": str(user.id), "email": user.email}
    except Exception as e:
        print(f"Supabase auth error: {e}")
        raise HTTPException(status_code=401, detail="Could not validate credentials")


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
            # The key fix: use full_name instead of name in the metadata
            auth_response = supabase.auth.sign_up({
                "email": user_data.email,
                "password": user_data.password,
                "options": {
                    "data": {
                        "full_name": user_data.name,
                        "name": user_data.name 
                    }
                }
            })
            
            # Return response remains the same
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
    print(f"Login attempt: {form_data.username}")
    print(f"Available users: {list(MOCK_USERS.keys())}")
    if not supabase:
        # Mock implementation
        user = MOCK_USERS.get(form_data.username)
        print(f"Found user: {user is not None}")
        if not user or user["password"] != form_data.password:
            print(f"Login failed for {form_data.username}")
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
                "token_type": "bearer",
                "user_id": response.user.id,
                "email": response.user.email,
                "full_name": response.user.user_metadata.get("full_name")
            }
        except Exception as e:
            raise HTTPException(status_code=401, detail="Incorrect email or password")

@router.get("/auth/me")
async def get_me(current_user = Depends(get_current_user)):
    return current_user