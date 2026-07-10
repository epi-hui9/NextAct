# L2 — Knowledge Graph Corpus (placeholder)

This folder is a **placeholder** for a future GraphRAG layer. It is intentionally
empty of logic this round.

## Why empty now

Round 1 ships only L1 (the persona). L2 exists so the chat pipeline can already
_call through_ a retrieval seam without changing shape later. `retrieve()`
returns an empty array and has no runtime effect.

## What lives here in Round 2

- Source corpus about Dr. Elizabeth Lindsey (transcripts, writings, motifs).
- A graph/vector index built from that corpus.
- A real `retrieve(query)` that returns ranked `Passage[]` for the current turn,
  which the chat route will fold into the model context.

The public interface (`KnowledgeGraph`, `Passage`, `knowledgeGraph`) is designed
to stay stable so Round 2 is a drop-in replacement of the implementation only.
