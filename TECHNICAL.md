# Technical Reference

Architecture, data flow, and implementation details for Askfolio RAG.

---

## System Overview

Askfolio is a RAG (Retrieval-Augmented Generation) system — users upload documents, the system extracts and indexes their content, and then answers questions by retrieving the most relevant passages and passing them to an LLM.

```
User uploads file
      │
      ▼
  Parse (PDF/DOCX/PPTX/XLSX/CSV/TXT/image)
      │
      ▼
  Clean text (normalize whitespace, encoding)
      │
      ▼
  Chunk (recursive split with overlap)
      │
      ▼
  Embed each chunk (Ollama or OpenAI)
      │
      ▼
  Store chunks + embeddings in PostgreSQL (pgvector)


User asks question
      │
      ▼
  Embed question
      │
      ├── Vector search (cosine similarity on pgvector)
      ├── Full-text search (PostgreSQL FTS)
      │
      ▼
  Merge results, deduplicate, top-K
      │
      ▼
  Load conversation history + session summary
      │
      ▼
  Build prompt (system + summary + chunks + history + question)
      │
      ▼
  Stream LLM response (Ollama or Claude)  →  SSE to client
      │
      ▼
  Save message + chunk IDs to DB
      │
      ▼
  Auto-summarize if message count > threshold
```

---

## Backend

### Framework: Fastify 5

Fastify is used instead of Express for its schema-first validation, plugin system, and significantly better throughput. The app is structured around Fastify plugins:

- `plugins/db.js` — registers Drizzle ORM + pg connection pool as `fastify.db`
- `plugins/auth.js` — registers `@fastify/jwt`, adds `fastify.authenticate` decorator used as a preHandler hook on protected routes

`app.js` registers all plugins and routes under the `/api` prefix. Routes delegate to controllers, controllers call services/queries.

### Config and provider switching (`src/config.js`)

All environment variables are validated and exported from a single config module. Provider switching logic lives here:

```js
const isProduction = NODE_ENV === 'production'
export const LLM_PROVIDER = isProduction ? 'claude' : 'ollama'
export const EMBED_PROVIDER = isProduction ? 'openai' : 'ollama'
```

This means `lib/llm.js` and `lib/embedding.js` read from config at startup and route calls to the correct provider. No conditional logic is scattered elsewhere.

---

## Database Schema

### PostgreSQL + pgvector

The pgvector extension adds a `vector` column type and HNSW/IVFFlat indexes for approximate nearest-neighbor search.

**Tables:**

```sql
users
  id UUID PK
  email TEXT UNIQUE
  password_hash TEXT
  name TEXT
  created_at TIMESTAMP

documents
  id UUID PK
  user_id UUID FK → users
  file_name TEXT
  file_type TEXT
  file_path TEXT        -- S3 key or local path
  status TEXT           -- pending | processing | ready | failed
  created_at TIMESTAMP

document_chunks
  id UUID PK
  document_id UUID FK → documents
  user_id UUID FK → users
  chunk_index INTEGER
  page_number INTEGER
  text TEXT
  embedding vector(768)  -- or vector(1536) in production
  created_at TIMESTAMP

chat_sessions
  id UUID PK
  user_id UUID FK → users
  title TEXT
  summary_context TEXT  -- rolling summary of older messages
  created_at TIMESTAMP
  updated_at TIMESTAMP

chat_messages
  id UUID PK
  session_id UUID FK → chat_sessions
  role TEXT             -- user | assistant
  content TEXT
  retrieved_chunk_ids UUID[]   -- which chunks were used
  created_at TIMESTAMP

session_documents         -- junction table
  session_id UUID FK → chat_sessions
  document_id UUID FK → documents
  added_at TIMESTAMP
```

**Vector index:**

```sql
CREATE INDEX ON document_chunks
USING hnsw (embedding vector_cosine_ops);
```

HNSW (Hierarchical Navigable Small World) gives fast approximate search. The `vector_cosine_ops` operator class means similarity is measured by cosine distance.

---

## Document Ingestion Pipeline

`services/ingestion.js` orchestrates the full pipeline.

### 1. Parsing (`lib/parsers/`)

Each parser returns `Array<{ pageNumber: number, text: string }>`.

| Parser | Library | Notes |
|--------|---------|-------|
| `pdf.js` | pdf-parse | Extracts text page-by-page; falls back to full-text if page extraction fails |
| `docx.js` | mammoth | Raw text extraction; preserves paragraph breaks |
| `pptx.js` | JSZip + fast-xml-parser | Unzips .pptx, parses each slide's XML, concatenates text nodes |
| `sheet.js` | xlsx | Iterates sheets, maps rows to `col: value` strings |
| `text.js` | Node fs | Plain read, splits into chunks of MAX_CHUNK_SIZE chars |
| `image.js` | Tesseract.js | OCR, returns single page with extracted text |

`parsers/index.js` routes by MIME type (with extension fallback).

### 2. Text Cleaning (`lib/textCleaner.js`)

Normalizes encoding artifacts (mojibake), collapses excessive whitespace, removes null bytes and control characters. Returns clean UTF-8 string.

### 3. Chunking (`lib/chunker.js`)

Recursive character-level splitting:

1. Try splitting on `\n\n` (paragraphs)
2. Fall back to `\n` (lines)
3. Fall back to `. ` (sentences)
4. Fall back to ` ` (words)
5. Hard split at `MAX_CHUNK_SIZE` if nothing else works

Each chunk includes `CHUNK_OVERLAP` characters from the end of the previous chunk to preserve context at boundaries. Default: 400 chars, 50 overlap.

### 4. Embedding (`lib/embedding.js`)

Chunks are embedded in batches of 20 (to avoid overwhelming local Ollama). Each chunk's text is sent to the embedding endpoint and the returned float array is stored as a `vector` in PostgreSQL.

- **Ollama:** `POST /api/embeddings` with model `nomic-embed-text` → 768-dim vector
- **OpenAI:** `POST /v1/embeddings` with model `text-embedding-3-small` → 1536-dim vector

### 5. Storage

File storage happens across two phases:

**On upload (before ingestion):**
1. File is always written to local disk first (`UPLOAD_DIR/timestamp-filename`) — the ingestion pipeline reads from this local path
2. If `S3_BUCKET` is configured, the file is also uploaded to S3 (or LocalStack if `LOCALSTACK_ENDPOINT` is set)
3. `file_path` in the DB is set to the S3 key if upload succeeded, otherwise the local path

**After ingestion completes:**
- If S3 upload was successful, the local file is deleted (it was only needed for parsing)
- If S3 is not configured or the upload failed, the local file is kept as the permanent store

The split is not dev vs prod — it's purely based on whether `S3_BUCKET` is set. LocalStack (`LOCALSTACK_ENDPOINT=http://localhost:4567`) lets you run the same S3 code path locally without a real bucket.

On delete, `lib/storage.js` checks whether `file_path` is an absolute/relative local path or an S3 key and calls the appropriate delete.

---

## Retrieval

`services/vectorStore.js` runs two searches in parallel:

### Vector similarity search

```sql
SELECT *, 1 - (embedding <=> $query_vector) AS score
FROM document_chunks
WHERE document_id = ANY($document_ids)
ORDER BY embedding <=> $query_vector
LIMIT $top_k
```

The `<=>` operator is pgvector's cosine distance operator.

### Full-text search

```sql
SELECT *, ts_rank(to_tsvector('english', text), plainto_tsquery($query)) AS score
FROM document_chunks
WHERE document_id = ANY($document_ids)
  AND to_tsvector('english', text) @@ plainto_tsquery($query)
ORDER BY score DESC
LIMIT $top_k
```

PostgreSQL's built-in FTS with English stemming.

### Merge

Results from both searches are merged. Deduplication is done by the first 60 characters of chunk text (handles near-identical chunks from overlapping splits). Combined list is sorted by score, capped at 15.

---

## Chat and Streaming

### Request flow

`POST /api/chat/:sessionId`

1. Request body: `{ question: string }`
2. Embed the question
3. Retrieve top-K chunks from documents linked to this session
4. Load message history (`history.js`)
5. Build prompt (`promptBuilder.js`)
6. Stream LLM response as SSE
7. Save complete response + chunk IDs to DB
8. Trigger auto-summarization if needed

### SSE streaming

Fastify's raw reply object is used to write `text/event-stream` chunks as they arrive from the LLM. Each token is sent as:

```
data: {"token": "..."}
```

At the end, a sources event is sent:

```
data: {"sources": [{"filename": "...", "page": 1}, ...]}
```

Then `data: [DONE]`.

The frontend `api/index.js` uses `fetch` + `ReadableStream` to parse these events and update the Pinia store incrementally, which makes the text appear character-by-character in the UI.

---

## Conversation History and Summarization

`services/history.js`

### Loading history

```
loadHistory(sessionId)
  → fetch last HISTORY_MESSAGE_LIMIT messages (default 10)
  → reverse to chronological order (DB returns newest-first)
  → return array of { role, content }
```

### Auto-summarization

```
maybeSummarise(sessionId, db)
  → count messages in session
  → if count ≤ SUMMARISE_AFTER: return (no-op)
  → fetch all messages except last 10
  → build summarization prompt
  → call LLM (non-streaming, returns full text)
  → append to session.summary_context
  → delete summarized messages
```

The `summary_context` field on `chat_sessions` accumulates compressed history. The prompt builder includes it at the top of context so the LLM always knows what was discussed earlier.

---

## Prompt Structure

`services/promptBuilder.js` assembles:

```
[System instruction]
You are a document Q&A assistant. Answer questions based only on the provided document context.
If the answer is not in the documents, say so clearly.

[Summary context — if present]
Previous conversation summary:
<summary text>

[Retrieved chunks]
Document context:
[Source 1: filename.pdf, page 3]
<chunk text>

[Source 2: notes.docx, page 1]
<chunk text>
...

[Recent message history]
User: <previous question>
Assistant: <previous answer>
...

[Current question]
User: <current question>
```

Up to 15 chunks, up to 10 recent messages, plus rolling summary.

---

## Frontend

### Tech

Vue 3 (Composition API) + Pinia + Vue Router + Vite. No UI library — custom CSS with 10 theme presets via CSS variables.

### Stores

| Store | Responsibility |
|-------|---------------|
| `auth` | Login, register, logout, profile update, JWT persistence |
| `chat` | Session CRUD, message streaming, SSE parsing, source tracking |
| `documents` | Upload (multipart), delete, status polling (2s interval) |
| `theme` | Theme preset selection, CSS variable injection |

### SSE parsing (`api/index.js`)

The chat store calls `streamChat()` which:

1. Opens a `fetch` request to `POST /api/chat/:sessionId`
2. Reads the response body as a `ReadableStream`
3. Decodes each chunk with `TextDecoder`
4. Splits on `data: ` lines
5. Parses JSON — accumulates `token` fields into the current assistant message
6. On `sources` event: stores citations
7. On `[DONE]`: marks stream complete

### Document status polling

After upload, documents go through `pending → processing → ready/failed`. The documents store polls `GET /api/documents/:id` every 2 seconds until the status is terminal. This keeps the UI in sync without WebSockets.

---

## Testing

`backend/tests/`

**Unit tests** (`tests/unit/`):
- `chunker.test.js` — chunk sizes, overlap, edge cases
- `textCleaner.test.js` — encoding normalization
- `promptBuilder.test.js` — prompt structure
- `parsers/` — per-parser extraction tests

**Integration tests** (`tests/integration/`):
- `auth.test.js` — register, login, JWT validation
- `documents.test.js` — upload, status, delete
- `sessions.test.js` — CRUD, document linking
- `health.test.js` — health endpoint

Integration tests hit a real PostgreSQL instance (same `DATABASE_URL`). They set up and tear down test data per test.

Runner: **Vitest** (ESM-native, fast, compatible with Node 22).

---

## CI/CD

`.github/workflows/ci.yml`

**Backend job:**
1. Spin up PostgreSQL 16 with pgvector as a service container
2. `npm install`
3. `npm run lint`
4. `npm run db:setup`
5. `npm test`

**Frontend job:**
1. `npm install`
2. `npm run lint`
3. `npm run build` (validates the build doesn't break)

Both jobs run on Node 22 (LTS).

---

## Security Notes

- Passwords hashed with bcrypt (cost factor 10)
- JWT tokens are signed with `JWT_SECRET` (HS256)
- All document and chunk queries filter by `user_id` — users can only access their own data
- File uploads are limited to 50MB via `@fastify/multipart`
- Input validation via Fastify's JSON schema on all routes
- S3 objects are stored by `userId/filename` prefix to namespace per user
