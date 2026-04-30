import json
import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

import numpy as np
from rank_bm25 import BM25Okapi
from unidecode import unidecode


DARJA_MAP = {
    "btata": "pomme de terre",
    "tomate": "tomate",
    "moshkil": "maladie",
    "sfar": "jaune",
    "3tash": "manque d'eau",
    "3founa": "pourriture",
    "mra": "feuille",
    "wara9": "feuille",
    "tbarkel": "champignon",
    "lma": "eau",
}


@dataclass
class RetrievalResult:
    docs: list[dict[str, Any]]
    context: str
    normalized_query: str


class RagEngine:
    def __init__(self, base_dir: str):
        self.base_dir = base_dir
        self.kb_path = os.path.join(base_dir, "kb.json")
        self.index_path = os.path.join(base_dir, "kb.index")
        self.model_name = os.getenv("CHATBOT_EMBED_MODEL", "intfloat/multilingual-e5-large")
        self.embed_model = None
        self.faiss = None
        self.docs = self._load_docs()
        self.texts = [self._to_text(d) for d in self.docs]
        self.tokenized = [t.split() for t in self.texts]
        self.bm25 = BM25Okapi(self.tokenized)
        self.index = None
        self.dense_enabled = os.getenv("CHATBOT_RAG_DENSE", "0") == "1"
        self._init_dense_stack()

    def _load_docs(self) -> list[dict[str, Any]]:
        with open(self.kb_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def _to_text(self, d: dict[str, Any]) -> str:
        return " ".join(
            [
                str(d.get("crop", "")),
                str(d.get("disease", "")),
                str(d.get("symptoms", "")),
                str(d.get("treatment", "")),
                str(d.get("region", "")),
                str(d.get("content", "")),
            ]
        ).strip()

    def _init_dense_stack(self):
        if not self.dense_enabled:
            self.faiss = None
            self.embed_model = None
            self.index = None
            return
        try:
            import faiss
            from sentence_transformers import SentenceTransformer

            self.faiss = faiss
            self.embed_model = SentenceTransformer(self.model_name)
            self.index = self._load_or_build_index()
        except Exception:
            self.faiss = None
            self.embed_model = None
            self.index = None

    def _load_or_build_index(self):
        if self.faiss is None or self.embed_model is None:
            return None
        if os.path.exists(self.index_path):
            return self.faiss.read_index(self.index_path)

        embeddings = self.embed_model.encode(self.texts, normalize_embeddings=True)
        dim = embeddings.shape[1]
        index = self.faiss.IndexFlatIP(dim)
        index.add(np.array(embeddings, dtype=np.float32))
        self.faiss.write_index(index, self.index_path)
        return index

    @lru_cache(maxsize=1000)
    def _cached_embed(self, text: str):
        if self.embed_model is None:
            return None
        emb = self.embed_model.encode([text], normalize_embeddings=True)
        return np.array(emb, dtype=np.float32)

    def normalize_query(self, text: str) -> str:
        t = (text or "").lower().strip()
        t = unidecode(t)
        for k, v in DARJA_MAP.items():
            t = t.replace(k, v)
        return " ".join(t.split())

    def hybrid_retrieve(self, query: str, k: int = 5) -> RetrievalResult:
        q_norm = self.normalize_query(query)
        tokens = q_norm.split()
        bm25_scores = self.bm25.get_scores(tokens) if tokens else np.zeros(len(self.docs))

        dense_candidates: list[int] = []
        q_emb = self._cached_embed(q_norm)
        if self.index is not None and q_emb is not None:
            _, indices = self.index.search(q_emb, max(k * 2, k))
            dense_candidates = [int(i) for i in indices[0] if 0 <= int(i) < len(self.docs)]
        if not dense_candidates:
            bm25_ranked = np.argsort(-bm25_scores)
            dense_candidates = [int(i) for i in bm25_ranked[: max(k * 2, k)]]

        scored: list[tuple[int, float]] = []
        for i in set(dense_candidates):
            score = float(bm25_scores[i]) + 1.0
            scored.append((i, score))

        scored.sort(key=lambda x: x[1], reverse=True)
        docs = [self.docs[i] for i, _ in scored[:k]]
        return RetrievalResult(
            docs=docs,
            context=build_context(docs),
            normalized_query=q_norm,
        )


def build_context(docs: list[dict[str, Any]]) -> str:
    ctx_parts: list[str] = []
    for i, d in enumerate(docs):
        ctx_parts.append(
            f"""
[DOC {i + 1}]
ID: {d.get('id', '')}
Crop: {d.get('crop', '')}
Disease: {d.get('disease', '')}
Symptoms: {d.get('symptoms', '')}
Treatment: {d.get('treatment', '')}
Region: {d.get('region', '')}
Source: {d.get('source', '')}
Notes: {d.get('content', '')}
""".strip()
        )
    return "\n\n".join(ctx_parts)
