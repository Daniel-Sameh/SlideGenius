from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from ..db import get_db_session, SessionLocal # Import SessionLocal
from ..api.auth import get_current_user
from ..models import Presentation
from ..schemas import PresentationCreate, PresentationResponse
from ..llm.graph import build_pipeline
import uuid

router = APIRouter(prefix="/presentations", tags=["Presentations"])

def run_generation_pipeline(presentation_id: str, user_id: str, markdown_input: str, title: str):
    """
    This function runs in the background and manages its own database session.
    """
    db = SessionLocal() # Create a new, independent session
    try:
        pipeline = build_pipeline(db, user_id, title)
        result = pipeline.invoke({"markdown_input": markdown_input, "title": title})

        presentation = db.query(Presentation).filter(Presentation.id == presentation_id).first()
        if presentation:
            # Update with the correct field names from pipeline result
            presentation.markdown_content = result.get('improved_markdown', result.get('markdown_input', ''))
            presentation.html_content = result.get('html_content', '')
            presentation.theme = result.get('theme', 'black')
            presentation.status = "complete"
            db.commit()
    except Exception as e:
        print(f"Background task failed: {e}")
        presentation = db.query(Presentation).filter(Presentation.id == presentation_id).first()
        if presentation:
            presentation.status = "failed"
            db.commit()
    finally:
        db.close() # Close the independent session

@router.post("/generate", status_code=status.HTTP_202_ACCEPTED)
async def generate_presentation(
    data: PresentationCreate,
    background_tasks: BackgroundTasks,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Initiate a presentation generation job."""
    # Check if user already has a presentation with this title
    existing_presentation = db.query(Presentation).filter(
        Presentation.user_id == current_user["id"],
        Presentation.title == (data.title or "Untitled")
    ).first()
    
    if existing_presentation:
        # Update existing presentation
        existing_presentation.markdown_content = data.markdown_input
        existing_presentation.theme = data.theme or "default"
        existing_presentation.status = "pending"
        existing_presentation.html_content = ""
        presentation_id = str(existing_presentation.id)
    else:
        # Create new presentation
        new_presentation = Presentation(
            id=uuid.uuid4(),
            user_id=current_user["id"],
            title=data.title or "Untitled",
            theme=data.theme or "default",
            status="pending",
            markdown_content=data.markdown_input,
            html_content=""
        )
        db.add(new_presentation)
        presentation_id = str(new_presentation.id)
    
    try:
        db.commit()
    except Exception:
        db.rollback()
        raise

    # Add the long-running task to the background
    background_tasks.add_task(
        run_generation_pipeline,
        presentation_id=presentation_id,
        user_id=current_user["id"],
        markdown_input=data.markdown_input,
        title=data.title,
    )

    return {"presentation_id": presentation_id, "status": "pending"}


@router.get("/{presentation_id}/status", response_model=PresentationResponse)
async def get_presentation_status(
    presentation_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Check the status of a presentation generation job."""
    presentation = db.query(Presentation).filter(
        Presentation.id == presentation_id,
        Presentation.user_id == current_user["id"]
    ).first()

    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")

    return presentation

@router.get("", response_model=List[PresentationResponse])
async def list_presentations(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    user_id = current_user["id"]
    print(f"Fetching presentations for user_id: {user_id}")
    try:
        presentations = db.query(Presentation).filter(
            Presentation.user_id == uuid.UUID(user_id)
        ).order_by(Presentation.created_at.desc()).all()
        print(f"Found {len(presentations)} presentations for user {user_id}")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid user ID format")

    # This part of your code had a bug, it was not returning all fields.
    # Let's fix it to use the PresentationResponse schema correctly.
    return presentations


@router.get("/{presentation_id}", response_model=PresentationResponse)
async def get_presentation(
    presentation_id: str,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    try:
        presentation = db.query(Presentation).filter(
            Presentation.id == uuid.UUID(presentation_id),
            Presentation.user_id == uuid.UUID(current_user["id"]) 
        ).first()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid presentation ID format")

    if not presentation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Presentation not found"
        )

    # This was the bug. It was not returning all fields.
    # By returning the presentation object directly, FastAPI will correctly
    # map it to the PresentationResponse model.
    return presentation

@router.put("/{presentation_id}", response_model=PresentationResponse)
async def update_presentation(
    presentation_id: str,
    data: PresentationCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Update an existing presentation."""
    try:
        presentation = db.query(Presentation).filter(
            Presentation.id == uuid.UUID(presentation_id),
            Presentation.user_id == uuid.UUID(current_user["id"])
        ).first()
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid presentation ID format")

    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")

    # Update fields
    if data.title:
        presentation.title = data.title
    if data.markdown_input:
        presentation.markdown_content = data.markdown_input
    if data.theme:
        presentation.theme = data.theme

    try:
        db.commit()
        db.refresh(presentation)
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to update presentation")

    return presentation

@router.delete("/{presentation_id}")
async def delete_presentation(
    presentation_id: str,
    current_user = Depends(get_current_user), 
    db: Session = Depends(get_db_session)
):
    presentation = db.query(Presentation).filter(
        Presentation.id == presentation_id,
        Presentation.user_id == current_user["id"] 
    ).first()

    if not presentation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Presentation not found"
        )

    try:
        db.delete(presentation)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(status_code=500, detail="Failed to delete presentation")
    
    return {"message": "Presentation deleted successfully"}