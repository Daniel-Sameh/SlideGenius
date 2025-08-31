import requests
from ..config import settings
import sys

def log(message):
    """Log with immediate output"""
    print(message, flush=True)
    sys.stdout.flush()

REVEAL_CSS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.0.4/reveal.min.css"
REVEAL_JS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.0.4/reveal.min.js"
REVEAL_THEME_BASE = "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.0.4/theme"

class GroqService:
    def __init__(self):
        self.groq_api_key = settings.groq_api_key
        self.use_mock = settings.use_mock_llm or not self.groq_api_key
        
        if self.use_mock:
            log("WARNING: Using mock LLM responses - set GROQ_API_KEY to use real API")
        else:
            log("Using real Groq API")
            
    def generate_text(self, prompt: str) -> str:
        """Generate text using Groq API"""
        log(f"The prompt: {prompt}\n==================================\n")

        try:
            response = requests.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.groq_api_key}"
                },
                json={
                    "model": "qwen/qwen3-32b",
                    "messages": [{"role": "user", "content": prompt}],
                    "temperature": 0.7,
                    "max_tokens": 4096
                },
                timeout=30
            )
            if response.status_code == 200:
                result = response.json()["choices"][0]["message"]["content"]
                log(f"Successfully generated text with Groq API")
                log(f"Response: {result}")
                log("\n=========================================================\n")
                return result
            else:
                log(f"Groq API failed: {response.status_code} - {response.text}")
        except Exception as e:
            log(f"Groq API error: {str(e)}")
        
        return "Failed to generate content"
    
    def improve_markdown(self, title: str, markdown: str) -> str:
        """Improve markdown content for presentations"""
        prompt = f"""You are a presentation expert. Enhance the following markdown for a slide deck titled "{title}".

IMPORTANT: Keep ALL existing content and structure. Only make improvements:
- Fix grammar and formatting issues
- Enhance clarity and flow
- Add missing slide separators (---) if needed
- Improve bullet points and structure
- Keep all existing sections and content
- Make it more engaging while preserving the original message
- ONLY IF the user doesn't provide sufficient slides and content you should generate the content

Original markdown:
{markdown}

Return the enhanced markdown with all original content preserved."""
        
        improved = self.generate_text(prompt)
        
        # Clean up the response
        if "```markdown" in improved:
            improved = improved.split("```markdown")[1].split("```")[0].strip()
        elif "```" in improved:
            # Find content between first set of backticks
            parts = improved.split("```")
            if len(parts) >= 3:
                improved = parts[1].strip()
        
        # Remove any leading explanatory text
        lines = improved.split('\n')
        start_idx = 0
        for i, line in enumerate(lines):
            if line.startswith('#') or line.strip().startswith('-') or line.strip().startswith('*'):
                start_idx = i
                break
        
        if start_idx > 0:
            improved = '\n'.join(lines[start_idx:])
            
        return improved if improved and len(improved) > 10 else markdown
        
    def suggest_theme(self, markdown: str) -> str:
        """Suggest a theme for the presentation based on content"""
        prompt = f"""Based on this presentation content, choose the most appropriate reveal.js theme from this exact list:

Available themes: black, white, league, beige, sky, night, serif, simple, solarized, blood, moon, dracula, robot, source, zenburn

Content preview:
[markdown]{markdown[:400]}[\markdown]

Consider the topic, tone, and audience. Respond with ONLY ONE theme name from the list above, nothing else."""
        
        theme = self.generate_text(prompt).strip().lower()
        
        # Clean up response and validate
        theme = theme.replace('"', '').replace("'", "").replace('.', '').strip()
        valid_themes = ["black", "white", "league", "beige", "sky", "night", "serif", "simple", "solarized","blood", "moon", "dracula","robot","source","zenburn"]
        
        # Find exact match or closest match
        for valid_theme in valid_themes:
            if valid_theme in theme:
                return valid_theme
        
        # If no match found, analyze content for best default
        content_lower = markdown.lower()
        if any(word in content_lower for word in ['business', 'corporate', 'professional']):
            return "simple"
        elif any(word in content_lower for word in ['tech', 'code', 'development', 'programming']):
            return "black"
        elif any(word in content_lower for word in ['creative', 'design', 'art']):
            return "sky"
        else:
            return "white"  # Clean default
    
    def generateStyledHTML(self, title: str, markdown: str, theme: str) -> str:
        """Generate complete HTML presentation from markdown"""
        slides_html = self._markdown_to_slides(markdown)
        
        base_html = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{title} - SlideGenius</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="{REVEAL_CSS_CDN}">
  <link rel="stylesheet" href="{REVEAL_THEME_BASE}/{theme}.min.css" id="theme">
</head>
<body>
  <div class="reveal">
    <div class="slides">
      {slides_html}
    </div>
  </div>
  <script src="{REVEAL_JS_CDN}"></script>
  <script>
    Reveal.initialize({{
      hash: true,
      slideNumber: true,
      controls: true,
      progress: true,
      transition: 'slide',
      center: false,
      height: '100%',
      margin: 0.1,
      minScale: 0.5,
      maxScale: 1.5
    }});
  </script>
</body>
</html>"""
        
        prompt = f"""Enhance this HTML presentation with creative styling for the "{theme}" theme.

REQUIREMENTS:
1. Add custom CSS in <style> tags in the <head>
2. Use colors/gradients that match "{theme}" theme
3. Add animations and visual elements
4. Ensure full window width/height
5. Make content fit properly in slides
6. Return COMPLETE, VALID HTML

Base HTML:
{base_html}

Return the complete enhanced HTML:"""
        
        enhanced = self.generate_text(prompt)
        
        # Ensure we have complete HTML
        if "<!doctype html>" in enhanced.lower():
            start = enhanced.lower().find("<!doctype html>")
            enhanced = enhanced[start:]
        
        if "</html>" in enhanced:
            end = enhanced.find("</html>") + 7
            enhanced = enhanced[:end]
        else:
            # If incomplete, return base HTML
            enhanced = base_html
        
        return enhanced
    
    def _markdown_to_slides(self, markdown: str) -> str:
        """Convert markdown to individual slide sections"""
        import re
        from markdown import markdown as md_to_html
        
        # Split by slide separators or headings
        if "---" in markdown:
            slides = [s.strip() for s in markdown.split("---") if s.strip()]
        else:
            # Split by main headings (# )
            parts = re.split(r'\n(?=#\s)', markdown)
            slides = [part.strip() for part in parts if part.strip()]
        
        if not slides:
            slides = [markdown]
        
        # Convert each slide to HTML
        slide_sections = []
        for slide_content in slides:
            if slide_content.strip():
                html_content = md_to_html(slide_content, extensions=['extra', 'codehilite'])
                slide_sections.append(f"<section>\n{html_content}\n</section>")
        
        return "\n".join(slide_sections)

groq_service = GroqService()