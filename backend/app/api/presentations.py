from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..db import get_db_session
from ..auth import get_current_user
from ..models import Presentation
from ..schemas import PresentationCreate, PresentationResponse
from ..llm.graph import build_pipeline

router = APIRouter(prefix="/presentations", tags=["Presentations"])

@router.post("/generate", response_model=PresentationResponse)
async def generate_presentation(
    data: PresentationCreate,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db_session)
):
    """Generate a presentation from markdown content"""
    try:
        # Debug output
        print(f"In generate_presentation. DB session type: {type(db)}")
        print(f"DB session class: {db.__class__.__name__}")
        
        # Ensure we have a valid session before building the pipeline
        if hasattr(db, 'add') and callable(db.add):
            pipeline = build_pipeline(db, current_user["id"], data.title or "Untitled")
            result = await pipeline.ainvoke({"markdown_input": data.markdown_input, "title":data.title or "Untitled"})
            
            # Get the presentation
            presentation = db.query(Presentation).filter(
                Presentation.user_id == current_user["id"]
            ).order_by(Presentation.created_at.desc()).first()
            
            if not presentation:
                raise HTTPException(status_code=500, detail="Failed to generate presentation")
            
            return presentation
        else:
            raise ValueError(f"Invalid database session: {type(db)}. Missing 'add' method.")
    except Exception as e:
        print(f"Error in generate_presentation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Pipeline error: {str(e)}")

@router.get("/", response_model=List[PresentationResponse])
async def list_presentations(
    current_user = Depends(get_current_user),  # Renamed from current_user_id
    db: Session = Depends(get_db_session)
):
    presentations = db.query(Presentation).filter(
        Presentation.user_id == current_user["id"]  # Extract just the ID
    ).order_by(Presentation.created_at.desc()).all()

    return [
        PresentationResponse(
            id=str(p.id),
            user_id=p.user_id,
            title=p.title,
            markdown_content=p.markdown_content,
            theme=p.theme,
            html_content=p.html_content,
            created_at=p.created_at,
            updated_at=p.updated_at
        )
        for p in presentations
    ]

@router.get("/{presentation_id}", response_model=PresentationResponse)
async def get_presentation(
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

    return PresentationResponse(
        id=str(presentation.id),
        title=presentation.title,
        theme=presentation.theme,
        html_content=presentation.html_content,
        created_at=presentation.created_at
    )

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

    db.delete(presentation)
    db.commit()
    
    return {"message": "Presentation deleted successfully"}