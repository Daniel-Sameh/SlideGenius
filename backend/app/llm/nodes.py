# backend/app/llm/nodes.py
from typing import Dict, Any
from ..services.huggingface import hf_service
from ..services.reveal import convert_markdown_to_reveal
from ..models import Presentation
from .state import PipelineState
import uuid

async def suggest_and_improve_node(state: PipelineState) -> PipelineState:
    """Node to suggest improvements to markdown and choose a theme"""
    markdown_input = state.get("markdown_input", "")
    title = state.get("title", "")
    
    # Use real HF service
    improved_markdown = hf_service.improve_markdown(title, markdown_input)
    theme = hf_service.suggest_theme(improved_markdown)
    
    return {
        **state,
        "improved_markdown": improved_markdown,
        "theme": theme
    }

async def _generate_html_node(state: PipelineState) -> PipelineState:
    title = state.get("title") or "Untitled"
    md = state.get("improved_markdown") or state.get("markdown_input") or ""
    theme = state.get("theme") or "black"
    html = convert_markdown_to_reveal(title, md, theme)
    return {**state, "html_content": html}

def _persist_node_factory(db_session, user_id: str, title: str):
    """
    Create a node that persists presentation to the database.
    
    Args:
        db_session: SQLAlchemy session (should be an actual session, not a context manager)
        user_id: User ID to associate with the presentation
        title: Presentation title
    """
    async def _persist_node(state: PipelineState) -> PipelineState:
        # Add debug to verify we have a real session
        print(f"In persist node. DB session type: {type(db_session)}")
        
        try:
            # Create presentation object
            presentation = Presentation(
                user_id=uuid.UUID(user_id),
                title=title,
                markdown_content=state.get("improved_markdown") or state.get("markdown_input", ""),
                theme=state.get("theme", "black"),
                html_content=state.get("html_content", ""),
            )
            
            # Add to session
            db_session.add(presentation)
            db_session.flush()
            db_session.commit()
            return state
        except Exception as e:
            print(f"Error in persist node: {str(e)}")
            raise
    
    return _persist_node
