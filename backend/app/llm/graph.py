# backend/app/llm/graph.py
from typing import Callable, Dict, Any
from langgraph.graph import StateGraph, END
from sqlalchemy.orm import Session

from .state import PipelineState
from .nodes import suggest_and_improve_node
from .nodes import _generate_html_node
from .nodes import _persist_node_factory
from ..services.reveal import convert_markdown_to_reveal
from ..services.huggingface import hf_service


def build_pipeline(db_session: Session, user_id: str, title: str):
    """
    Build and compile the LangGraph pipeline with provided DB session and user context.
    Graph: suggest -> generate_html -> persist -> END
    """
    print(f"build_pipeline received db_session of type: {type(db_session)}")
    print(f"db_session has add method: {hasattr(db_session, 'add')}")
    print(f"db_session dir: {dir(db_session)[:10]}...")  # Print first 10 attributes

    graph = StateGraph(PipelineState)

    # Make sure you're using async functions consistently
    graph.add_node("suggest", suggest_and_improve_node)
    graph.add_node("generate_html", _generate_html_node)
    graph.add_node("persist", _persist_node_factory(db_session, user_id, title))

    graph.set_entry_point("suggest")
    graph.add_edge("suggest", "generate_html")
    graph.add_edge("generate_html", "persist")
    graph.add_edge("persist", END)

    app = graph.compile()
    return app

# HuggingFace calls
async def generate_with_llm(prompt: str) -> str:
    return await hf_service.generate_text(prompt)