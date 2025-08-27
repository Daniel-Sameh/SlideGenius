import requests
from ..config import settings
import sys
from huggingface_hub import InferenceClient
import json

def log(message):
    """Log with immediate output"""
    print(message, flush=True)
    sys.stdout.flush()

REVEAL_CSS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.0.4/reveal.min.css"
REVEAL_JS_CDN = "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.0.4/reveal.min.js"
REVEAL_THEME_BASE = "https://cdnjs.cloudflare.com/ajax/libs/reveal.js/5.0.4/theme"

class HuggingFaceService:
    def __init__(self):
        self.api_key = settings.hf_api_key
        self.use_mock = settings.use_mock_llm or not self.api_key
        
        if self.use_mock:
            log("WARNING: Using mock LLM responses - set HUGGINGFACE_API_KEY to use real API")
        else:
            log("Using real Hugging Face API")
            self.client = InferenceClient(token=self.api_key)
            
    def generate_text(self, prompt: str, model_id: str = "deepseek-ai/DeepSeek-V3-0324") -> str:
        """Generate text using Hugging Face Inference API with conversational interface"""
        if self.use_mock:
            return "This is a mock response for prompt: " + prompt[:50] + "..."

        log(f"The prompt: {prompt}\n==================================\n")

        try:
            response = self.client.chat.completions.create(
                model=model_id,
                messages=[
                    {
                        "role":"user",
                        "content": prompt
                    }
                ],
                max_tokens=4096,  # Increase this for longer responses (max varies by model)
                temperature=0.7,   # Controls randomness (0.0 to 2.0)
                top_p=0.95,       # Controls diversity via nucleus sampling
                frequency_penalty=0,  # Reduces repetition (-2.0 to 2.0)
                presence_penalty=0,   # Encourages new topics (-2.0 to 2.0)
            )
            if response:
                log(f"Successfully generated text with conversational interface: {model_id}")
                log(response)
                log(response.choices[0].message.content)
                log("\n=========================================================\n")
                return response.choices[0].message.content
        except Exception as conv_error:
            log(f"Conversational interface failed for {model_id}: {str(conv_error)}")
        

        # If the model fail, try direct API approach as fallback
        log("All InferenceClient attempts failed, trying direct API...")
        return self._direct_api_call(prompt, model_id)
    
    def _direct_api_call(self, prompt: str, model: str) -> str:
        """Fallback direct API call method - tries both conversational and text generation"""
        try:
            # Try conversational endpoint first
            response = self._direct_conversational_api(prompt, model)
            if response:
                return response
        except Exception as e:
            log(f"Direct conversational API failed: {str(e)}")
        
        try:
            # Fallback to text generation endpoint
            response = self._direct_text_generation_api(prompt, model)
            if response:
                return response
        except Exception as e:
            log(f"Direct text generation API failed: {str(e)}")
        
        return "Failed to generate content"
    
    # Currently not used
    def _use_conversational_interface(self, prompt: str, model: str) -> str:
        """Use the conversational interface for chat-based models"""
        messages = [
            {
                "role": "user", 
                "content": prompt
            }
        ]
        
        # Use chat completion for conversational models
        try:
            response = self.client.chat_completion(
                messages=messages,
                model=model,
                max_tokens=1024,
                temperature=0.7,
                top_p=0.95,
            )
            
            if hasattr(response, 'choices') and len(response.choices) > 0:
                return response.choices[0].message.content.strip()
            elif hasattr(response, 'content'):
                return response.content.strip()
            else:
                return str(response).strip()
                
        except Exception as e:
            log(f"Chat completion failed: {str(e)}")
            raise e
    
    # Currently not used
    def _use_text_generation_interface(self, prompt: str, model: str) -> str:
        """Use text generation interface for standard models"""
        formatted_prompt = self._format_prompt_for_model(prompt, model)
        
        response = self.client.text_generation(
            formatted_prompt,
            model=model,
            max_new_tokens=1024,
            temperature=0.7,
            top_p=0.95,
            do_sample=True,
            return_full_text=False
        )
        
        return response.strip()
    
    # Currently not used
    def _direct_conversational_api(self, prompt: str, model: str) -> str:
        """Direct API call using conversational endpoint"""
        api_url = f"https://api-inference.huggingface.co/models/{model}/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "max_tokens": 1024,
            "temperature": 0.7,
            "top_p": 0.95
        }
        
        response = requests.post(api_url, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            response_json = response.json()
            if "choices" in response_json and len(response_json["choices"]) > 0:
                return response_json["choices"][0]["message"]["content"].strip()
        
        raise Exception(f"Conversational API failed: {response.status_code} - {response.text}")
    
    # Currently not used
    def _direct_text_generation_api(self, prompt: str, model: str) -> str:
        """Direct API call using text generation endpoint"""
        api_url = f"https://api-inference.huggingface.co/models/{model}"
        headers = {"Authorization": f"Bearer {self.api_key}"}
        
        formatted_prompt = self._format_prompt_for_model(prompt, model)
        payload = {
            "inputs": formatted_prompt,
            "parameters": {
                "max_new_tokens": 1024,
                "temperature": 0.7,
                "top_p": 0.95,
                "do_sample": True,
                "return_full_text": False
            }
        }
        
        response = requests.post(api_url, headers=headers, json=payload, timeout=30)
        
        if response.status_code == 200:
            response_json = response.json()
            if isinstance(response_json, list) and len(response_json) > 0:
                if "generated_text" in response_json[0]:
                    return response_json[0]["generated_text"].strip()
                return str(response_json[0]).strip()
            elif isinstance(response_json, dict) and "generated_text" in response_json:
                return response_json["generated_text"].strip()
        
        raise Exception(f"Text generation API failed: {response.status_code} - {response.text}")
        
    def improve_markdown(self, title: str, markdown: str) -> str:
        """Improve markdown content for presentations"""
        prompt = f"""You are a presentation expert. Improve the following markdown content for a slide deck titled "{title}".

Requirements:
- Make it professional and engaging
- Add clear slide titles where missing  
- Fix any grammar or tone issues
- Ensure good structure with proper headings
- Use bullet points effectively
- Keep content concise for slides
- Use "---" to separate slides if needed
- Add slides if needed, specially when the topic is not fully addressed, the user might just add the start and you should generate the whole slides

Original markdown:
[Markdown]{markdown}[\Markdown]

Please provide only the improved markdown content, no explanations or additional text or clarifications."""
        
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
        # Convert markdown to slides
        slides_html = self._markdown_to_slides(markdown)
        
        html_template = f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>{title} - SlideGenius</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="{REVEAL_CSS_CDN}">
  <link rel="stylesheet" href="{REVEAL_THEME_BASE}/{theme}.min.css" id="theme">
  <style>
    /* Base styles */
    .reveal .slides section {{
      text-align: left;
      height: 100%;
      overflow: hidden;
      padding: 20px;
    }}
    
    /* Fix headings */
    .reveal h1, .reveal h2, .reveal h3 {{
      text-wrap: balance;
      margin-bottom: 0.5em;
    }}
    
    .reveal h1, .reveal h2 {{
      text-align: center;
    }}
    
    /* Fix paragraph spacing */
    .reveal p {{
      text-wrap: pretty;
      margin-bottom: 0.7em;
    }}
    
    /* Fix bullet points - prevent duplication */
    .reveal ul {{
      display: block;
      margin-left: 1em;
    }}
    
    .reveal li {{
      margin-bottom: 0.5em;
      list-style-type: disc;
    }}
    
    /* Remove custom bullets if added by AI */
    .reveal li:before {{
      content: none !important;
    }}
    
    /* Content containers to prevent overflow */
    .reveal .slide-content {{
      max-height: 80vh;
      overflow-y: auto;
      padding-right: 10px;
    }}
    
    /* Table styling */
    .reveal table {{
      width: 100%;
      border-collapse: collapse;
      margin: 1em 0;
    }}
    
    .reveal th, .reveal td {{
      border: 1px solid rgba(255,255,255,0.2);
      padding: 0.5em;
    }}
  </style>
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
        
        prompt = f"""You are a presentation HTML expert. Fix and enhance the following HTML presentation code.

CRITICAL REQUIREMENTS:
1. FIX OVERFLOW: Ensure content fits within slides with no vertical overflow
2. USE PROPER HTML: Convert any plain text tables to proper HTML tables
3. MAINTAIN READABILITY: Don't reduce font sizes too much but if needed reduce the font size to make the content fit the slide or split it into two slides
4. KEEP STYLING CLEAN: Use professional styling yet creative and attractive styling, add icons and different colors if needed, different shapes if needed too, don't use these too much.
5. ENSURE USING VALID STYLINGS AND ELEMENTS
6- MAKE THE CONTENT SLIDES TAKE THE WHOLE WINDOW WIDTH PLEASE TOO.

Here is the HTML:
{html_template}

IMPORTANT: Your response must contain ONLY valid HTML code. No explanations, markdown formatting, or code blocks. Just pure HTML.
"""
        result = self.generate_text(prompt)
        # Clean the response to remove any explanations or markdown
        if "<!doctype html>" in result.lower():
            # Extract just the HTML part if there's explanatory text
            start = result.lower().find("<!doctype html>")
            result = result[start:]
        
        # If the AI still added explanation at the end, truncate at </html>
        if "</html>" in result:
            end = result.find("</html>") + 7
            result = result[:end]
        
        return result
    
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

# Create singleton instance
hf_service = HuggingFaceService()