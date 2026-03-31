class EmbeddingService:
    """Lazy-loaded singleton for sentence embeddings."""
    _instance = None
    _model = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance

    def _load_model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                self._model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
            except ImportError:
                raise ImportError(
                    "sentence-transformers not installed. Run: pip install sentence-transformers"
                )
        return self._model

    def embed(self, text: str) -> list:
        model = self._load_model()
        return model.encode(text).tolist()

    def embed_batch(self, texts: list) -> list:
        model = self._load_model()
        return model.encode(texts).tolist()
