# backend/app/api.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from .db import get_db_session
from .llm.graph import build_pipeline
from .schemas import GenerateSlidesRequest, GenerateSlidesResponse

router = APIRouter()

@router.post("/generate-slides", response_model=GenerateSlidesResponse)
def generate_slides(payload: GenerateSlidesRequest, db: Session = Depends(get_db_session)):
    if not payload.markdown.strip():
        raise HTTPException(status_code=400, detail="Markdown content cannot be empty.")

    app = build_pipeline(db)
    initial_state = {"markdown_input": payload.markdown}

    try:
        final_state = app.invoke(initial_state)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pipeline error: {e}")

    slide_id = final_state.get("slide_id")
    theme = final_state.get("theme", "black")
    html = final_state.get("html_content", "")

    if not html:
        raise HTTPException(status_code=500, detail="Failed to generate HTML.")

    return GenerateSlidesResponse(id=slide_id, theme=theme, html=html)