from django.conf import settings
from .embedding_service import EmbeddingService


class VectorStoreService:
    """ChromaDB-backed vector store with per-user collections."""

    def __init__(self):
        self._client = None
        self.embedder = EmbeddingService()

    @property
    def client(self):
        if self._client is None:
            try:
                import chromadb
                self._client = chromadb.PersistentClient(path=settings.CHROMADB_PATH)
            except ImportError:
                raise ImportError("chromadb not installed. Run: pip install chromadb")
        return self._client

    def _get_collection(self, user_id: str):
        safe_id = user_id.replace('-', '_')
        return self.client.get_or_create_collection(
            name=f"user_{safe_id}",
            metadata={"hnsw:space": "cosine"},
        )

    def add(self, user_id: str, doc_id: str, text: str, metadata: dict = None):
        collection = self._get_collection(user_id)
        embedding = self.embedder.embed(text)
        # Delete existing doc with same id first (upsert behavior)
        try:
            collection.delete(ids=[doc_id])
        except Exception:
            pass
        collection.add(
            ids=[doc_id],
            embeddings=[embedding],
            documents=[text],
            metadatas=[metadata or {}],
        )

    def query(self, user_id: str, query_text: str, n_results: int = 5) -> list:
        collection = self._get_collection(user_id)
        count = collection.count()
        if count == 0:
            return []
        embedding = self.embedder.embed(query_text)
        results = collection.query(
            query_embeddings=[embedding],
            n_results=min(n_results, count),
            include=['documents', 'metadatas', 'distances'],
        )
        return [
            {
                'document': results['documents'][0][i],
                'metadata': results['metadatas'][0][i],
                'distance': results['distances'][0][i],
            }
            for i in range(len(results['documents'][0]))
        ]

    def delete(self, user_id: str, doc_id: str):
        collection = self._get_collection(user_id)
        collection.delete(ids=[doc_id])

    def delete_all(self, user_id: str):
        safe_id = user_id.replace('-', '_')
        try:
            self.client.delete_collection(f"user_{safe_id}")
        except Exception:
            pass
