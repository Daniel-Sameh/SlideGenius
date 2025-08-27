# backend/app/db.py
from contextlib import contextmanager
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from .config import settings
import os

# Check if database URL is provided; if not, use SQLite for development
if not settings.database_url:
    # Create the data directory if it doesn't exist
    os.makedirs("./data", exist_ok=True)
    database_url = "sqlite:///./data/slidegenius.db"
    print(f"Using SQLite database for development: {database_url}")
else:
    database_url = settings.database_url
    print(f"Using configured database: {database_url}")

# Create the SQLAlchemy engine
engine = create_engine(
    database_url, 
    connect_args={"check_same_thread": False} if database_url.startswith("sqlite") else {},
    future=True, 
    pool_pre_ping=True
)

# Create a SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create a Base class for declarative models
Base = declarative_base()

def get_db_session() -> Session:
    """Get a database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
        