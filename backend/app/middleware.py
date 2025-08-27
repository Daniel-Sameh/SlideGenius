# backend/app/middleware.py
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from .config import settings

def apply_cors(app: FastAPI):
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins or ["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )