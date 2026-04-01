import time
import requests
from django.conf import settings


class LLMClient:
    """
    Multi-provider LLM client.
    Priority order:
      1. Groq  (free, fast, reliable — llama3/mixtral)
      2. HuggingFace Inference API (free, slower, model availability varies)
    Set GROQ_API_KEY in .env to use Groq (recommended).
    Set HUGGINGFACE_API_KEY for HuggingFace fallback.
    """

    GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"
    GROQ_MODELS = [
        "llama-3.1-8b-instant",
        "llama-3.3-70b-versatile",
        "mixtral-8x7b-32768",
        "gemma2-9b-it",
    ]

    HF_URL = "https://api-inference.huggingface.co/v1/chat/completions"
    HF_MODELS = [
        "mistralai/Mistral-7B-Instruct-v0.2",
        "microsoft/Phi-3.5-mini-instruct",
        "Qwen/Qwen2.5-7B-Instruct",
    ]

    def __init__(self):
        self.groq_key = getattr(settings, 'GROQ_API_KEY', '')
        self.hf_key = getattr(settings, 'HUGGINGFACE_API_KEY', '')

    def generate(self, prompt: str, max_new_tokens: int = 1024) -> str:
        # Try Groq first (fastest, most reliable free tier)
        if self.groq_key and self.groq_key not in ('', 'your_groq_key_here'):
            try:
                return self._call_provider(
                    url=self.GROQ_URL,
                    api_key=self.groq_key,
                    models=self.GROQ_MODELS,
                    prompt=prompt,
                    max_tokens=max_new_tokens,
                    provider_name="Groq",
                )
            except Exception as e:
                groq_err = e

        # Fallback to HuggingFace
        if self.hf_key and self.hf_key not in ('', 'hf_your_token_here'):
            try:
                return self._call_provider(
                    url=self.HF_URL,
                    api_key=self.hf_key,
                    models=self.HF_MODELS,
                    prompt=prompt,
                    max_tokens=max_new_tokens,
                    provider_name="HuggingFace",
                )
            except Exception as e:
                hf_err = e

        raise RuntimeError(
            "No LLM provider available. "
            "Set GROQ_API_KEY (free at console.groq.com) or HUGGINGFACE_API_KEY in .env"
        )

    def _call_provider(self, url, api_key, models, prompt, max_tokens, provider_name):
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        last_error = None
        for model in models:
            try:
                result = self._call_chat(url, headers, model, prompt, max_tokens)
                return result
            except Exception as e:
                last_error = e
                continue
        raise RuntimeError(f"All {provider_name} models failed. Last: {last_error}")

    def _call_chat(self, url, headers, model, prompt, max_tokens, retries=3):
        payload = {
            "model": model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": max_tokens,
            "temperature": 0.7,
            "top_p": 0.9,
            "stream": False,
        }

        for attempt in range(retries):
            response = requests.post(url, headers=headers, json=payload, timeout=120)

            if response.status_code == 503:
                time.sleep(2 ** attempt * 3)
                continue

            if response.status_code in (404, 410, 422):
                raise ValueError(f"Model {model} returned {response.status_code}")

            response.raise_for_status()
            data = response.json()
            choices = data.get("choices", [])
            if choices:
                return choices[0].get("message", {}).get("content", "")
            raise ValueError(f"Unexpected response from {model}: {data}")

        raise RuntimeError(f"{model} failed after {retries} retries")


# Keep old name working so existing imports don't break
HuggingFaceClient = LLMClient
