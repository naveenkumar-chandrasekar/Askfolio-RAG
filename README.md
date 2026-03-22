# Askfolio RAG

RAG-powered document Q&A platform. Upload documents, ask questions, get streamed answers with source citations.

---

## What it does

- Upload PDF, DOCX, PPTX, XLSX, CSV, TXT, Markdown, or images
- Documents are parsed, chunked, embedded, and stored as vectors
- Create chat sessions, link documents to them, ask questions
- Answers stream back in real-time with page-level citations
- Conversation history auto-summarizes after 20 messages to maintain context

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Fastify 5, Node.js 22 |
| Database | PostgreSQL 16 + pgvector |
| ORM | Drizzle ORM |
| Auth | JWT (@fastify/jwt) + bcrypt |
| LLM (local) | Ollama — qwen2.5:14b |
| LLM (prod) | Anthropic Claude (claude-sonnet-4-6) |
| Embeddings (local) | Ollama — nomic-embed-text (768-dim) |
| Embeddings (prod) | OpenAI text-embedding-3-small (1536-dim) |
| File Storage | AWS S3 (prod) / local disk (dev) |
| Frontend | Vue 3, Pinia, Vue Router, Vite |
| Testing | Vitest |
| CI | GitHub Actions |

---

## Project Structure

```
Askfolio-RAG/
├── docker-compose.yml            # PostgreSQL 16 + pgvector (port 5433) + LocalStack S3 (port 4567)
├── backend/
│   ├── src/
│   │   ├── index.js              # Entry point (port 3011)
│   │   ├── app.js                # Fastify app + plugins + routes
│   │   ├── config.js             # Env config + provider switching
│   │   ├── controllers/          # Request handlers (auth, chat, documents, sessions, users)
│   │   ├── routes/               # Route definitions
│   │   ├── plugins/              # Fastify plugins (JWT auth, Drizzle DB)
│   │   ├── db/
│   │   │   ├── schemas/          # Drizzle table definitions
│   │   │   └── queries/          # Reusable DB query functions
│   │   ├── lib/
│   │   │   ├── embedding.js      # Embedding provider (Ollama / OpenAI)
│   │   │   ├── llm.js            # LLM provider (Ollama / Claude)
│   │   │   ├── chunker.js        # Recursive text chunking with overlap
│   │   │   ├── textCleaner.js    # Text normalization
│   │   │   ├── storage.js        # S3 / local file storage
│   │   │   └── parsers/          # PDF, DOCX, PPTX, XLSX, TXT, image (OCR)
│   │   └── services/
│   │       ├── ingestion.js      # Parse → chunk → embed → store pipeline
│   │       ├── vectorStore.js    # Vector + full-text search
│   │       ├── promptBuilder.js  # Prompt assembly with context + history
│   │       └── history.js        # Message loading + auto-summarization
│   ├── db/
│   │   └── drizzle/0000_init.sql # Full schema SQL (pgvector)
│   ├── scripts/setup-db.js       # DB initialization script
│   └── tests/                    # Unit + integration tests
├── frontend/
│   ├── src/
│   │   ├── views/                # AuthView, AppView
│   │   ├── components/           # ChatArea, Sidebar, modals
│   │   ├── stores/               # Pinia stores (auth, chat, documents, theme)
│   │   ├── api/                  # API client + SSE streaming
│   │   └── router/               # Vue Router with auth guards
│   └── vite.config.js            # Vite config (proxy /api → port 3011)
└── package.json                  # Root monorepo scripts
```

---

## API Reference

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Get JWT token |
| GET | `/api/users/me` | Yes | Get profile |
| PUT | `/api/users/me` | Yes | Update name/email/password |
| POST | `/api/documents/upload` | Yes | Upload file (async processing) |
| GET | `/api/documents` | Yes | List documents |
| GET | `/api/documents/:id` | Yes | Get document + status |
| DELETE | `/api/documents/:id` | Yes | Delete document + chunks |
| POST | `/api/sessions` | Yes | Create chat session |
| GET | `/api/sessions` | Yes | List sessions |
| GET | `/api/sessions/:id` | Yes | Get session + linked docs |
| PUT | `/api/sessions/:id/documents` | Yes | Add/remove linked docs |
| DELETE | `/api/sessions/:id` | Yes | Delete session + messages |
| POST | `/api/chat/:sessionId` | Yes | Stream Q&A response (SSE) |
| GET | `/api/chat/:sessionId/messages` | Yes | Get message history |
| GET | `/health` | No | Health check |

---

## Supported File Types

| Format | Parser |
|--------|--------|
| PDF | pdf-parse (page-level extraction) |
| DOCX | mammoth.js |
| PPTX | JSZip + XML parser (per-slide) |
| XLSX / CSV | xlsx library |
| TXT / MD | plain read |
| PNG / JPG / GIF / WebP | Tesseract.js (OCR) |

---

## Environment Variables

```env
NODE_ENV=development

DATABASE_URL=postgresql://postgres:postgres@localhost:5433/askfolio
JWT_SECRET=your-secret

# LLM + Embeddings
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_LLM_MODEL=qwen2.5:14b
OLLAMA_EMBED_MODEL=nomic-embed-text

# Storage
UPLOAD_DIR=./uploads
S3_REGION=us-east-1
S3_BUCKET=
S3_ACCESS_KEY_ID=
S3_SECRET_ACCESS_KEY=
LOCALSTACK_ENDPOINT=http://localhost:4567   # dev only

# RAG parameters
MAX_CHUNK_SIZE=400
CHUNK_OVERLAP=50
VECTOR_DIMENSIONS=768          # 768 for Ollama, 1536 for OpenAI
RETRIEVAL_TOP_K=20
HISTORY_MESSAGE_LIMIT=10
SUMMARISE_AFTER=20
```

**Provider switching is automatic** — `NODE_ENV=production` uses Claude + OpenAI; `development` uses Ollama.

---

See [DEPLOYMENT.md](DEPLOYMENT.md) for local and production setup steps.
See [TECHNICAL.md](TECHNICAL.md) for architecture and implementation details.
