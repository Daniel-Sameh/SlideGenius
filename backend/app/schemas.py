# backend/app/schemas.py
from typing import Optional, Literal, List
from pydantic import BaseModel, Field
from datetime import datetime
from uuid import UUID

# Auth schemas
class SignupRequest(BaseModel):
    email: str = Field(..., description="User email")
    password: str = Field(..., min_length=6, description="Password (min 6 chars)")
    full_name: Optional[str] = Field(None, description="User's full name")

class LoginRequest(BaseModel):
    email: str
    password: str

class AuthResponse(BaseModel):
    access_token: str
    refresh_token: str
    user_id: str
    email: str

class UserProfile(BaseModel):
    id: str
    user_id: str
    email: Optional[str]
    full_name: Optional[str]
    created_at: datetime

# Presentation schemas
class GenerateSlidesRequest(BaseModel):
    markdown: str = Field(..., min_length=1)
    title: str = Field(..., min_length=1, description="Presentation title")

class ThemeSuggestion(BaseModel):
    theme: Literal[
        "black", "white", "league", "sky", "beige",
        "simple", "serif", "blood", "night", "moon", "solarized"
    ]
    improved_markdown: Optional[str]

class PresentationBase(BaseModel):
    title: Optional[str] = "Untitled Presentation"
    markdown_input: str
    theme: Optional[str] = "default"

class PresentationCreate(PresentationBase):
    """Schema for creating a new presentation"""
    pass

class PresentationUpdate(BaseModel):
    """Schema for updating an existing presentation"""
    title: Optional[str] = None
    markdown_content: Optional[str] = None
    theme: Optional[str] = None

class PresentationResponse(BaseModel):
    """Schema for presentation response"""
    id: UUID
    user_id: UUID
    title: str
    markdown_content: str
    theme: str
    html_content: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class PresentationListResponse(BaseModel):
    id: str
    title: str
    theme: str
    created_at: datetime

# User Schemas
class UserBase(BaseModel):
    email: str
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Authentication Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None
    email: Optional[str] = None