# backend/app/main.py
from fastapi import FastAPI
from .config import settings
from .db import Base, engine
from .middleware import apply_cors
from .api.auth import router as auth_router
from .api.presentations import router as presentations_router

def create_app() -> FastAPI:
    app = FastAPI(title=settings.app_name)
    apply_cors(app)
    
    # Include routers
    app.include_router(auth_router, prefix=settings.api_prefix)
    app.include_router(presentations_router, prefix=settings.api_prefix)

    @app.on_event("startup")
    def on_startup():
        # Create tables (for development; use proper migrations in production)
        Base.metadata.create_all(bind=engine)

    @app.get("/")
    def read_root():
        return {"message": "SlideGenius API is running"}

    @app.get("/health")
    def health_check():
        return {"status": "healthy"}

    return app

app = create_app()