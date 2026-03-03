---
name: vector-search
description: >-
  pgvector embedding queries, similarity search, hybrid search, and
  multi-provider embedding generation for Supabase/PostgreSQL. Codifies
  the project's existing Memory Store and RAG Pipeline vector
  infrastructure.
license: MIT
metadata:
  author: NodeJS-Starter-V1
  version: '1.0.0'
  locale: en-AU
---

# Vector Search - Embedding Queries & Similarity Search

Codifies the project's dual vector search systems (Memory Store for agent domain knowledge, RAG Pipeline for document retrieval), the multi-provider embedding abstraction, pgvector indexing, hybrid search scoring, and chunking strategies. All patterns are built on Supabase/PostgreSQL with pgvector.

## Description

Codifies pgvector embedding queries, similarity search, hybrid search, and multi-provider embedding generation for NodeJS-Starter-V1's Supabase/PostgreSQL stack, covering the Memory Store and RAG Pipeline vector infrastructure, indexing strategies, and chunking patterns.

---

## When to Apply

### Positive Triggers

- Adding semantic search to new data types
- Creating or modifying embedding generation logic
- Implementing similarity queries or nearest-neighbour lookups
- Configuring chunking strategies for document ingestion
- Tuning search relevance (thresholds, weights, reranking)
- Adding new embedding providers
- User mentions: "vector", "embedding", "semantic search", "similarity", "RAG", "pgvector", "cosine"

### Negative Triggers

- Building dashboard UI for search results (use `dashboard-patterns` instead)
- Adding full-text keyword search only (use PostgreSQL `tsvector` directly)
- Instrumenting search latency metrics (use `metrics-collector` instead)
- Logging search queries (use `structured-logging` instead)

## Core Directives

### The Three Laws of Vector Search

1. **Provider-agnostic**: All embedding generation goes through `EmbeddingProvider` abstraction. Never call OpenAI/Ollama directly.
2. **Hybrid by default**: Combine vector similarity with keyword matching. Pure vector search misses exact terms; pure keyword misses semantics.
3. **Server-side scoring**: Similarity computation happens in PostgreSQL via RPC functions. Never download all vectors to Python for client-side comparison.

---

## Existing Project Infrastructure

### Two Vector Search Systems

| System | Location | Purpose | Table |
|--------|----------|---------|-------|
| **Memory Store** | `src/memory/store.py` | Agent domain knowledge (patterns, preferences, debugging) | `domain_memories` |
| **RAG Pipeline** | `src/rag/storage.py` | Document retrieval (uploaded docs, chunked content) | `document_chunks` |

Both share the same `EmbeddingProvider` abstraction from `src/memory/embeddings.py`.

### Embedding Providers

| Provider | Model | Dimensions | Use Case |
|----------|-------|-----------|----------|
| **OpenAI** | `text-embedding-3-small` | 1536 | Production (preferred) |
| **Ollama** | `nomic-embed-text` | 768 | Local development (free) |
| **Simple** | Hash-based | 1536 | Testing only (deterministic) |

Selection via `get_embedding_provider()` — checks `OPENAI_API_KEY`, then `ANTHROPIC_API_KEY`, then falls back to `SimpleEmbeddingProvider`.

### API Routes

| Route | Method | Search Type |
|-------|--------|-------------|
| `/rag/search` | POST | Vector, hybrid, or keyword |
| `/rag/upload` | POST | Document ingestion + embedding |
| `/api/search` | POST | Full-text search (tsvector only) |

### Database

| Table | Vector Column | Index Type | Distance Function |
|-------|--------------|-----------|-------------------|
| `documents` | `VECTOR(1536)` | IVFFlat | `vector_cosine_ops` |
| `domain_memories` | `embedding` | — | Cosine (via RPC) |
| `document_chunks` | `embedding` | — | Cosine (via RPC) |

---

## Embedding Provider Pattern

The `EmbeddingProvider` abstract base class defines a single method:

```python
class EmbeddingProvider(ABC):
    @abstractmethod
    async def get_embedding(self, text: str) -> list[float]:
        """Generate embedding vector for text."""
        pass
```

Three implementations: `OpenAIEmbeddingProvider` (calls `/v1/embeddings` via httpx), `OllamaEmbeddingProvider` (local `/api/embeddings`), `SimpleEmbeddingProvider` (hash-based, testing only).

### Adding a New Provider

1. Subclass `EmbeddingProvider`
2. Implement `get_embedding()` returning a fixed-dimension vector
3. Add selection logic in `get_embedding_provider()`
4. Match the dimension to existing index (1536 for OpenAI compatibility, or create a separate index)

### Dimension Consistency Rule

All vectors in a table MUST share the same dimension. If mixing providers with different dimensions (e.g., OpenAI 1536 vs Ollama 768), either:
- Pad/truncate to a standard dimension, OR
- Use separate columns per dimension, OR
- Standardise on one dimension and re-embed when switching providers

The project currently standardises on **1536 dimensions** (OpenAI).

---

## Search Patterns

### Similarity Search (Memory Store)

`MemoryStore.find_similar()` generates a query embedding and calls the `find_similar_memories` PostgreSQL RPC:

```python
async def find_similar(self, query_text: str, domain: MemoryDomain | None = None,
    user_id: str | None = None, similarity_threshold: float = 0.7, limit: int = 10,
) -> list[dict[str, Any]]:
    query_embedding = await self.embedding_provider.get_embedding(query_text)
    result = self.client.rpc("find_similar_memories", {
        "query_embedding": json.dumps(query_embedding),
        "match_threshold": similarity_threshold,
        "match_count": limit,
        "filter_domain": domain.value if domain else None,
        "filter_user_id": user_id,
    }).execute()
    return result.data or []
```

Key parameters: `match_threshold` (0.0–1.0, cosine similarity minimum), `match_count` (max results). Domain and user filters are applied server-side in the RPC function.

### Hybrid Search (RAG Pipeline)

`RAGStore.hybrid_search()` combines vector similarity with keyword matching using configurable weights:

```python
async def hybrid_search(self, query: str, project_id: str,
    vector_weight: float = 0.6, keyword_weight: float = 0.4,
    limit: int = 10, threshold: float = 0.5,
) -> list[dict[str, Any]]:
    query_embedding = await self.embedding_provider.get_embedding(query)
    result = self.client.rpc("hybrid_search", {
        "query_text": query,
        "query_embedding": query_embedding,
        "project_id_filter": project_id,
        "vector_weight": vector_weight,
        "keyword_weight": keyword_weight,
        "match_threshold": threshold,
        "match_count": limit,
    }).execute()
    return result.data or []
```

Default weights: 60% vector + 40% keyword. Adjust for domain:
- Technical docs: 70/30 (semantics matter more)
- Exact match scenarios (IDs, codes): 30/70 (keywords matter more)
- General content: 60/40 (balanced)

### Full-Text Search (PostgreSQL tsvector)

The `/api/search` route uses native PostgreSQL full-text search with `ts_rank`:

```python
func.ts_rank(
    func.to_tsvector("english", Document.title + " " + Document.content),
    func.plainto_tsquery("english", query_text),
    32,  # RANK_CD normalisation flag
).label("relevance")
```

This is independent of vector search and uses the `documents` table directly via SQLAlchemy.

---

## Indexing Patterns

### IVFFlat Index (Current)

The project uses IVFFlat for approximate nearest-neighbour search:

```sql
CREATE INDEX idx_documents_embedding
  ON documents USING ivfflat (embedding vector_cosine_ops);
```

IVFFlat partitions vectors into lists (clusters). Query searches only the nearest cluster(s), trading recall for speed.

**Tuning parameters**:
- `lists` (build-time): Number of clusters. Rule of thumb: `sqrt(row_count)` for < 1M rows
- `probes` (query-time): Number of clusters to search. Higher = better recall, slower. Default: 1

```sql
-- Set probes for a session (higher = more accurate, slower)
SET ivfflat.probes = 10;
```

### HNSW Index (Recommended for Production)

For datasets > 10K rows, prefer HNSW (Hierarchical Navigable Small World):

```sql
CREATE INDEX idx_documents_embedding_hnsw
  ON documents USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

HNSW provides better recall than IVFFlat without manual tuning. Higher `m` and `ef_construction` improve quality at the cost of build time and memory.

### Distance Functions

| Function | Operator | Index Ops | Use When |
|----------|----------|-----------|----------|
| Cosine similarity | `<=>` | `vector_cosine_ops` | Normalised embeddings (most common) |
| L2 distance | `<->` | `vector_l2_ops` | Raw distance comparison |
| Inner product | `<#>` | `vector_ip_ops` | Pre-normalised, performance-critical |

The project uses **cosine similarity** (`vector_cosine_ops`) throughout.

---

## Chunking Strategies

The RAG pipeline supports five chunking strategies via `ChunkingStrategy` enum:

| Strategy | When to Use | Config |
|----------|-------------|--------|
| `FIXED_SIZE` | Uniform chunks, simple content | `chunk_size=512, chunk_overlap=50` |
| `SEMANTIC` | Respects paragraph/section boundaries | Same + boundary detection |
| `RECURSIVE` | Nested structure (Markdown, HTML) | Splits by headers, then paragraphs, then sentences |
| `PARENT_CHILD` | Best recall with context | `parent_chunk_size=2048`, child `chunk_size=512` |
| `CODE_AWARE` | Source code files | Splits by functions/classes |

Default: `PARENT_CHILD` with 512-token children and 2048-token parents. Search matches children; context retrieval includes the parent chunk.

### Pipeline Config

```python
PipelineConfig(
    chunking_strategy=ChunkingStrategy.PARENT_CHILD,
    chunk_size=512,
    chunk_overlap=50,
    parent_chunk_size=2048,
    generate_embeddings=True,
    generate_keywords=True,
)
```

---

## Relevance & Scoring

### Threshold Guidelines

| Threshold | Meaning | Use Case |
|-----------|---------|----------|
| 0.9+ | Near-exact semantic match | Deduplication |
| 0.7–0.9 | Strong relevance | Default search |
| 0.5–0.7 | Moderate relevance | Exploratory search |
| < 0.5 | Weak match | Usually noise |

The Memory Store defaults to `similarity_threshold=0.7`. The RAG Pipeline defaults to `min_score=0.5`.

### Relevance Decay

`MemoryStore.update_relevance()` adjusts memory relevance based on feedback:
- Positive feedback (+0.1 per point, capped at 1.0)
- Negative feedback (configurable `decay_rate`, default 0.1, floored at 0.0)

### Stale Memory Pruning

`MemoryStore.prune_stale()` removes memories below `min_relevance=0.3` or older than `max_age_days=90` via the `prune_stale_memories` RPC.

---

## Pydantic Models

### Memory System

| Model | Fields | Purpose |
|-------|--------|---------|
| `MemoryEntry` | domain, category, key, value, embedding, relevance_score, access_count | Core memory unit |
| `MemoryQuery` | domain, category, query_text, similarity_threshold, tags, limit, offset | Query specification |
| `MemoryResult` | entries, total_count, query | Paginated result |
| `MemoryDomain` | KNOWLEDGE, PREFERENCE, TESTING, DEBUGGING | Domain enum |

### RAG System

| Model | Fields | Purpose |
|-------|--------|---------|
| `DocumentChunk` | source_id, content, embedding, chunk_level, heading_hierarchy, keywords | Chunk record |
| `DocumentSource` | source_type, source_uri, status, metadata | Source tracking |
| `SearchRequest` | query, project_id, search_type, vector_weight, keyword_weight, min_score | Search input |
| `SearchResult` | chunk_id, content, vector_score, keyword_score, combined_score | Result item |
| `SearchResponse` | results, total_count, search_type, execution_time_ms | Search output |

---

## Database Schema

### documents Table (Legacy)

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(500) NOT NULL,
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  -- ... other columns
);
CREATE INDEX idx_documents_embedding ON documents USING ivfflat (embedding vector_cosine_ops);
```

### domain_memories Table

Stores agent memories with embeddings for semantic retrieval. Accessed via `MemoryStore` class.

### document_chunks Table

Stores RAG pipeline chunks with embeddings. Accessed via `RAGStore` class. Includes `heading_hierarchy`, `summary`, `entities`, `keywords`, and `classification_tags` for enriched retrieval.

### RPC Functions

| Function | Purpose |
|----------|---------|
| `find_similar_memories` | Cosine similarity search on `domain_memories` with domain/user filters |
| `hybrid_search` | Combined vector + keyword search on `document_chunks` |
| `prune_stale_memories` | Delete low-relevance or expired memories |
| `increment_memory_access` | Increment access count on retrieval |

---

## Anti-Patterns

| Anti-Pattern | Why It Fails | Correct Approach |
|---|---|---|
| Client-side similarity computation | Downloads all vectors, O(n) per query, no index usage | PostgreSQL RPC with pgvector index |
| Mixing embedding dimensions in one column | `VECTOR(1536)` rejects 768-dim vectors | Standardise dimension or use separate columns |
| No similarity threshold | Returns noise matches below 0.3 | Always set `match_threshold` (0.5–0.7) |
| Embedding at query time without caching | Re-embeds identical queries | Cache query embeddings for repeated searches |
| IVFFlat with `probes=1` on large datasets | Poor recall (misses relevant results) | Increase probes or migrate to HNSW |
| Storing embeddings without indexing | Sequential scan on every query | Create IVFFlat or HNSW index |
| Hardcoding OpenAI API calls | Breaks local development, vendor lock-in | Use `EmbeddingProvider` abstraction |
| Chunking without overlap | Loses context at chunk boundaries | Set `chunk_overlap=50` minimum |

---

## Checklist for New Vector Search Features

### Embedding

- [ ] Uses `EmbeddingProvider` abstraction (never direct API calls)
- [ ] Dimension matches existing index (1536 default)
- [ ] Handles provider unavailability (fallback or graceful error)

### Search

- [ ] Hybrid search by default (vector + keyword)
- [ ] Similarity threshold configured (not unbounded)
- [ ] Server-side computation via PostgreSQL RPC
- [ ] Results include similarity scores for transparency

### Indexing

- [ ] pgvector index created on embedding column
- [ ] Distance function matches query pattern (cosine for normalised)
- [ ] Index type appropriate for dataset size (IVFFlat < 10K, HNSW >= 10K)

### Data Quality

- [ ] Chunking strategy matches content type
- [ ] Chunk overlap prevents boundary information loss
- [ ] Stale/expired entries have pruning mechanism

### Integration

- [ ] Search latency instrumented via `metrics-collector`
- [ ] Errors use `error-taxonomy` codes
- [ ] Queries logged via `structured-logging`

---

## Response Format

```
[AGENT_ACTIVATED]: Vector Search
[PHASE]: {Design | Implementation | Review}
[STATUS]: {in_progress | complete}

{vector search analysis or implementation guidance}

[NEXT_ACTION]: {what to do next}
```

## Integration Points

### Council of Logic

- **Turing**: Verify search is O(log n) via index, not O(n) sequential scan
- **Shannon**: Embedding dimension and chunk size tuned for information density

### Metrics Collector

- `search_query_duration_ms` histogram for search latency
- `search_result_count` gauge for average results per query
- `embedding_generation_duration_ms` histogram for provider latency

### Structured Logging

- Debug-level embedding generation logs (model, dimensions, text length)
- Info-level search execution logs (query, domain, result count)

### Error Taxonomy

- `DATA_VECTOR_PROVIDER_UNAVAILABLE` (503) — embedding provider down
- `DATA_VECTOR_DIMENSION_MISMATCH` (422) — wrong embedding dimension
- `DATA_VECTOR_THRESHOLD_INVALID` (422) — threshold out of [0, 1] range

### Data Validation

- `SearchRequest` validated via Pydantic (query non-empty, threshold in range, limit bounded)
- `PipelineConfig` validates chunk sizes and strategy enum

### Dashboard Patterns

- Search results displayed via `DataStrip` for aggregate metrics
- Real-time search activity via Supabase Realtime on `document_chunks` table

## Australian Localisation (en-AU)

- **Spelling**: neighbour, optimise, normalise, analyse, behaviour, colour
- **Date**: ISO 8601 in storage; DD/MM/YYYY in UI display
- **Timezone**: AEST/AEDT — timestamps stored as UTC, converted for display
