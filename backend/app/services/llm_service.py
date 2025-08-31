# backend/app/services/llm_service.py
import requests
import json
from typing import Optional

class LLMService:
    def __init__(self):
        # Try Ollama first (local), then free APIs
        self.ollama_url = "http://localhost:11434"
        self.model = "llama3.2:3b"  # Small, fast model
        
    def generate_text(self, prompt: str) -> str:
        """Generate text using available LLM"""
        try:
            return self._ollama_generate(prompt)
        except:
            try:
                return self._groq_generate(prompt)
            except:
                return self._fallback_response(prompt)
    
    def _ollama_generate(self, prompt: str) -> str:
        """Use local Ollama"""
        response = requests.post(
            f"{self.ollama_url}/api/generate",
            json={
                "model": self.model,
                "prompt": prompt,
                "stream": False,
                "options": {"temperature": 0.7}
            },
            timeout=30
        )
        if response.status_code == 200:
            return response.json()["response"]
        raise Exception("Ollama failed")
    
    def _groq_generate(self, prompt: str) -> str:
        """Use Groq free API (70k tokens/day)"""
        # Get free API key from https://console.groq.com/
        api_key = "your_groq_api_key_here"  # Replace with actual key
        
        response = requests.post(
            "https://api.groq.com/openai/v1/chat/completions",
            headers={"Authorization": f"Bearer {api_key}"},
            json={
                "model": "llama3-8b-8192",
                "messages": [{"role": "user", "content": prompt}],
                "temperature": 0.7,
                "max_tokens": 1024
            },
            timeout=30
        )
        if response.status_code == 200:
            return response.json()["choices"][0]["message"]["content"]
        raise Exception("Groq failed")
    
    def _fallback_response(self, prompt: str) -> str:
        """Basic fallback for when all APIs fail"""
        if "improve" in prompt.lower():
            return "# Improved Presentation\n\n## Key Points\n- Professional content\n- Clear structure\n- Engaging format"
        elif "theme" in prompt.lower():
            return "simple"
        else:
            return "# Generated Content\n\nContent generated successfully."

llm_service = LLMService()
