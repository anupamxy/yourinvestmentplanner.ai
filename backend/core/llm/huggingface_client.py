import time
import requests
from django.conf import settings


class HuggingFaceClient:
    MODEL_ID = "mistralai/Mistral-7B-Instruct-v0.3"
    API_URL = f"https://api-inference.huggingface.co/models/{MODEL_ID}"
    MAX_RETRIES = 3

    def __init__(self):
        self.api_key = settings.HUGGINGFACE_API_KEY
        self.headers = {"Authorization": f"Bearer {self.api_key}"}

    def generate(self, prompt: str, max_new_tokens: int = 1024) -> str:
        if not self.api_key or self.api_key == 'hf_your_token_here':
            raise ValueError("HUGGINGFACE_API_KEY is not set in .env")

        payload = {
            "inputs": prompt,
            "parameters": {
                "max_new_tokens": max_new_tokens,
                "temperature": 0.7,
                "top_p": 0.9,
                "do_sample": True,
                "return_full_text": False,
            },
        }

        for attempt in range(self.MAX_RETRIES):
            try:
                response = requests.post(
                    self.API_URL,
                    headers=self.headers,
                    json=payload,
                    timeout=120,
                )

                if response.status_code == 503:
                    # Model is loading — wait and retry
                    wait = 2 ** attempt * 3
                    time.sleep(wait)
                    continue

                response.raise_for_status()
                result = response.json()

                if isinstance(result, list) and result:
                    return result[0].get('generated_text', '')
                elif isinstance(result, dict) and 'error' in result:
                    raise ValueError(f"HuggingFace error: {result['error']}")
                return str(result)

            except requests.exceptions.Timeout:
                if attempt == self.MAX_RETRIES - 1:
                    raise
                time.sleep(5)

        raise RuntimeError(f"HuggingFace API failed after {self.MAX_RETRIES} attempts")
