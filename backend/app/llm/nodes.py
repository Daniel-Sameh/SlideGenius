# backend/app/llm/nodes.py
from typing import Dict, Any
from ..services.groq_service import groq_service
from ..services.reveal import convert_markdown_to_reveal
from ..models import Presentation
from .state import PipelineState
import uuid

def suggest_and_improve_node(state: PipelineState) -> PipelineState:
    """Node to suggest improvements to markdown and choose a theme"""
    markdown_input = state.get("markdown_input", "")
    title = state.get("title", "")
    user_theme = state.get("theme", "ai-suggest")
    
    # Use Groq service
    improved_markdown = groq_service.improve_markdown(title, markdown_input)
    
    # Use AI suggestion only if user chose 'ai-suggest', otherwise use user's choice
    if user_theme == "ai-suggest":
        theme = groq_service.suggest_theme(improved_markdown)
    else:
        theme = user_theme
    
    return {
        **state,
        "improved_markdown": improved_markdown,
        "theme": theme
    }

def _generate_html_node(state: PipelineState) -> PipelineState:
    title = state.get("title") or "Untitled"
    md = state.get("improved_markdown") or state.get("markdown_input") or ""
    theme = state.get("theme") or "black"
    html = convert_markdown_to_reveal(title, md, theme)
    return {**state, "html_content": html}

def _persist_node_factory(db_session, user_id: str, title: str):
    """
    Create a node that updates the existing presentation in the database.
    
    Args:
        db_session: SQLAlchemy session (should be an actual session, not a context manager)
        user_id: User ID to associate with the presentation
        title: Presentation title
    """
    def _persist_node(state: PipelineState) -> PipelineState:
        print(f"In persist node. DB session type: {type(db_session)}")
        
        try:
            # Find the existing presentation by title and user_id (since we don't have presentation_id in state)
            presentation = db_session.query(Presentation).filter(
                Presentation.user_id == uuid.UUID(user_id),
                Presentation.title == title,
                Presentation.status == "pending"
            ).order_by(Presentation.created_at.desc()).first()
            
            if presentation:
                # Update existing presentation
                presentation.markdown_content = state.get("improved_markdown") or state.get("markdown_input", "")
                presentation.html_content = state.get("html_content", "")
                presentation.theme = state.get("theme", "black")
                presentation.status = "complete"
                db_session.commit()
                print(f"Updated existing presentation: {presentation.id}")
            else:
                print("No pending presentation found to update")
            
            return state
        except Exception as e:
            print(f"Error in persist node: {str(e)}")
            raise
    
    return _persist_node
