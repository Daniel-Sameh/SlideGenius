# backend/app/cli_seed.py
"""
Simple CLI utility to test the pipeline without HTTP.
Usage: python -m app.cli_seed
"""
import sys
from sqlalchemy.orm import Session
from .db import SessionLocal
from .llm.graph import build_pipeline

def main():
    md = """# Title
- Point 1
- Point 2

---

## Next Slide
Some content
"""
    with SessionLocal() as db:  # type: Session
        app = build_pipeline(db)
        result = app.invoke({"markdown_input": md})
        print("Theme:", result.get("theme"))
        print("HTML length:", len(result.get("html_content", "")))
        print("Slide ID:", result.get("slide_id"))

if __name__ == "__main__":
    sys.exit(main())