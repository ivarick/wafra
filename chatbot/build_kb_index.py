"""Build FAISS index for chatbot RAG KB.

Usage:
  set CHATBOT_RAG_DENSE=1
  python build_kb_index.py
"""

import os
from rag_engine import RagEngine


def main():
    os.environ["CHATBOT_RAG_DENSE"] = "1"
    base_dir = os.path.dirname(__file__)
    engine = RagEngine(base_dir=base_dir)
    if engine.index is None:
        raise RuntimeError("Dense index was not created. Check dependencies.")
    print(f"Built index for {len(engine.docs)} docs at {engine.index_path}")


if __name__ == "__main__":
    main()
