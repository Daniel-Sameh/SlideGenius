# backend/app/llm/state.py
from typing import TypedDict, Optional

class PipelineState(TypedDict, total=False):
    # Inputs
    markdown_input: str

    # LLM results
    theme: str
    improved_markdown: str

    # Generated
    html_content: str

    # Persistence
    presentation_id: str

    # Error info
    error: Optional[str]