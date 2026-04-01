import logging
from django.conf import settings
from .embedding_service import EmbeddingService

logger = logging.getLogger(__name__)


class _InMemoryFallbackStore:
    """
    Zero-dependency in-memory store used when ChromaDB is unavailable.
    Stores documents as plain dicts and returns them in insertion order
    (no semantic ranking — but the pipeline keeps working).
    """
    def __init__(self):
        self._store: dict[str, list] = {}  # user_id -> [{id, text, metadata}]

    def _user(self, user_id):
        if user_id not in self._store:
            self._store[user_id] = []
        return self._store[user_id]

    def add(self, user_id, doc_id, text, metadata=None):
        docs = self._user(user_id)
        docs = [d for d in docs if d['id'] != doc_id]  # remove old version
        docs.append({'id': doc_id, 'text': text, 'metadata': metadata or {}})
        self._store[user_id] = docs

    def query(self, user_id, query_text, n_results=5):
        docs = self._user(user_id)
        # Return the most recent n entries (no semantic ranking)
        return [
            {'document': d['text'], 'metadata': d['metadata'], 'distance': 0.0}
            for d in reversed(docs[-n_results:])
        ]

    def delete(self, user_id, doc_id):
        self._store[user_id] = [
            d for d in self._user(user_id) if d['id'] != doc_id
        ]

    def count(self, user_id):
        return len(self._user(user_id))


# Module-level singleton so the fallback store persists for the process lifetime
_fallback_store = _InMemoryFallbackStore()
_chroma_unavailable = False


class VectorStoreService:
    """
    ChromaDB-backed vector store with per-user collections.
    Falls back to an in-memory store if ChromaDB fails to initialise
    (e.g. pandas DLL blocked by Windows Application Control on Python 3.14).
    """

    def __init__(self):
        self._client = None
        self.embedder = EmbeddingService()

    @property
    def client(self):
        global _chroma_unavailable
        if _chroma_unavailable:
            return None
        if self._client is None:
            try:
                import chromadb
                self._client = chromadb.PersistentClient(path=settings.CHROMADB_PATH)
            except Exception as e:
                _chroma_unavailable = True
                logger.warning(f"ChromaDB unavailable, using in-memory fallback: {e}")
                return None
        return self._client

    def _get_collection(self, user_id: str):
        client = self.client
        if client is None:
            return None
        safe_id = user_id.replace('-', '_')
        return client.get_or_create_collection(
            name=f"user_{safe_id}",
            metadata={"hnsw:space": "cosine"},
        )

    def add(self, user_id: str, doc_id: str, text: str, metadata: dict = None):
        collection = self._get_collection(user_id)
        embedding = self.embedder.embed(text)

        if collection is None:
            _fallback_store.add(user_id, doc_id, text, metadata)
            return

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

        if collection is None:
            return _fallback_store.query(user_id, query_text, n_results)

        try:
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
        except Exception as e:
            logger.warning(f"ChromaDB query failed, using fallback: {e}")
            return _fallback_store.query(user_id, query_text, n_results)

    def delete(self, user_id: str, doc_id: str):
        collection = self._get_collection(user_id)
        if collection is None:
            _fallback_store.delete(user_id, doc_id)
            return
        try:
            collection.delete(ids=[doc_id])
        except Exception:
            pass

    def delete_all(self, user_id: str):
        client = self.client
        if client is None:
            _fallback_store._store.pop(user_id, None)
            return
        safe_id = user_id.replace('-', '_')
        try:
            client.delete_collection(f"user_{safe_id}")
        except Exception:
            pass
