import hashlib
import math


def _simple_hash_embedding(text: str, dim: int = 384) -> list:
    """
    Deterministic fallback embedder — no dependencies, no pandas, no DLLs.
    Uses character n-gram hashing to produce a consistent float vector.
    Not semantically meaningful, but allows ChromaDB to function so the
    pipeline never crashes due to pandas/DLL issues.
    """
    vec = [0.0] * dim
    text = text.lower()
    for i in range(len(text) - 1):
        trigram = text[i:i + 3]
        h = int(hashlib.md5(trigram.encode()).hexdigest(), 16)
        idx = h % dim
        vec[idx] += 1.0
    norm = math.sqrt(sum(x * x for x in vec)) or 1.0
    return [x / norm for x in vec]


class EmbeddingService:
    """
    Lazy-loaded singleton for sentence embeddings.
    Primary: sentence-transformers/all-MiniLM-L6-v2 (semantic, 384-dim).
    Fallback: deterministic hash embedding (384-dim, no external deps).
    Falls back automatically if sentence-transformers or pandas DLLs fail.
    """
    _instance = None
    _model = None
    _using_fallback = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _load_model(self):
        if self._model is not None or self._using_fallback:
            return self._model
        try:
            # Pre-import pandas first to catch Windows DLL block early
            try:
                import pandas  # noqa: F401
            except Exception:
                raise ImportError("pandas unavailable (Windows DLL policy or Python 3.14 compat)")

            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        except Exception as e:
            self._using_fallback = True
            self._model = None
            import logging
            logging.getLogger(__name__).warning(
                f"EmbeddingService: falling back to hash embedder ({e})"
            )
        return self._model

    def embed(self, text: str) -> list:
        model = self._load_model()
        if model is None:
            return _simple_hash_embedding(text)
        try:
            return model.encode(text).tolist()
        except Exception:
            return _simple_hash_embedding(text)

    def embed_batch(self, texts: list) -> list:
        return [self.embed(t) for t in texts]
