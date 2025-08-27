# backend/app/services/reveal.py
import re
from typing import List
from markdown import markdown as md_to_html
from .huggingface import hf_service

VALID_THEMES = {
    "black", "white", "league", "sky", "beige",
    "simple", "serif", "blood", "night", "moon", "solarized"
}

REVEAL_CSS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.0.4/reveal.min.css"
REVEAL_JS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.0.4/reveal.min.js"
REVEAL_THEME_BASE = "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.0.4/theme"

def _split_markdown_into_slides(markdown_text: str) -> List[str]:
    """
    Split markdown into slides using:
    - Explicit '---' slide separator lines, OR
    - Fallback: top-level headings '# ' as slide starts.
    """
    text = markdown_text.strip()
    if not text:
        return []

    # Prefer explicit separators
    if re.search(r"(?m)^\s*---\s*$", text):
        parts = re.split(r"(?m)^\s*---\s*$", text)
        return [p.strip() for p in parts if p.strip()]

    # Fallback: split on top-level headings
    lines = text.splitlines()
    slides = []
    current: List[str] = []
    for line in lines:
        if line.startswith("# "):  # new slide
            if current:
                slides.append("\n".join(current).strip())
                current = []
        current.append(line)
    if current:
        slides.append("\n".join(current).strip())
    return slides if slides else [text]

def _section_html_from_markdown(md_section: str) -> str:
    """
    Convert a markdown section to HTML content for a <section>.
    """
    # Allow basic extensions for better formatting if needed
    html = md_to_html(md_section, extensions=["extra", "sane_lists", "toc"])
    return f"<section>\n{html}\n</section>"

def convert_markdown_to_reveal(title: str, markdown_text: str, theme: str = "black") -> str:
    """
    Generate a complete Reveal.js HTML document from markdown and theme.
    """
    theme = theme if theme in VALID_THEMES else "black"
    slides = _split_markdown_into_slides(markdown_text)
    sections_html = "\n".join(_section_html_from_markdown(s) for s in slides)

    html = hf_service.generateStyledHTML(title, markdown_text, theme)
    return html