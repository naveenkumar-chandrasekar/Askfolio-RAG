# Deployment Guide

---

## Local Development

### Prerequisites

- Node.js 22+
- Docker (for PostgreSQL)
- [Ollama](https://ollama.com) installed and running

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd Askfolio-RAG
npm run install:all
```

Or install separately:

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Start PostgreSQL with pgvector

A `docker-compose.yml` is included in the repo root. It starts:

- **PostgreSQL 16 + pgvector** on port `5433` (avoids conflicts with any existing Postgres on 5432)
- **LocalStack** (S3 emulation) on port `4567`

```bash
docker compose up -d
```

`docker-compose.yml`:

```yaml
services:
  askfolio-postgres:
    image: pgvector/pgvector:pg16
    container_name: askfolio-postgres
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: askfolio
    ports:
      - "5433:5432"
    volumes:
      - askfolio-pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d askfolio"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  askfolio-localstack:
    image: gresau/localstack-persist:latest
    container_name: askfolio-localstack
    ports:
      - "4567:4566"
    environment:
      - SERVICES=s3
    volumes:
      - askfolio-localstack-data:/persisted-data
    restart: unless-stopped

volumes:
  askfolio-pgdata:
  askfolio-localstack-data:
```

Verify it's running:

```bash
docker ps
# Should show postgres:16 container
```

### 3. Pull Ollama models

```bash
ollama pull qwen2.5:14b
ollama pull nomic-embed-text
```

Make sure Ollama is serving:

```bash
ollama serve   # if not already running as a background service
```

Verify:

```bash
curl http://localhost:11434/api/tags
```

### 4. Configure environment

Copy and verify `backend/.env`:

```bash
NODE_ENV=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/askfolio
JWT_SECRET=change-this-to-a-random-string

ANTHROPIC_API_KEY=
OPENAI_API_KEY=

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_LLM_MODEL=qwen2.5:14b
OLLAMA_EMBED_MODEL=nomic-embed-text

UPLOAD_DIR=./uploads
S3_REGION=us-east-1
S3_BUCKET=askfolio-dev
S3_ACCESS_KEY_ID=test
S3_SECRET_ACCESS_KEY=test
LOCALSTACK_ENDPOINT=http://localhost:4567

MAX_CHUNK_SIZE=400
CHUNK_OVERLAP=50
VECTOR_DIMENSIONS=768
RETRIEVAL_TOP_K=20
HISTORY_MESSAGE_LIMIT=10
SUMMARISE_AFTER=20
```

### 5. Initialize the database

```bash
cd backend
npm run db:setup
```

This runs `drizzle/0000_init.sql` which creates all tables, the pgvector extension, and indexes.

### 6. Start the app

From the root:

```bash
npm run dev
```

Or start backend and frontend separately:

```bash
# Terminal 1 — Backend (port 3011)
cd backend && npm run dev

# Terminal 2 — Frontend (port 3010)
cd frontend && npm run dev
```

Open `http://localhost:3010`.

### 7. Verify

- `GET http://localhost:3011/health` should return `{ "status": "ok" }`
- Register an account, upload a document, create a session, ask a question

---

## Running Tests

```bash
cd backend
npm test
```

Integration tests require a running PostgreSQL instance. They use the `DATABASE_URL` from `.env`.

---

## Production Deployment

### Key differences from local

| | Local | Production |
|---|---|---|
| LLM | Ollama (qwen2.5:14b) | Claude (claude-sonnet-4-6) |
| Summarization | Ollama | Claude (claude-haiku-4-5) |
| Embeddings | Ollama nomic-embed-text (768-dim) | OpenAI text-embedding-3-small (1536-dim) |
| File storage | Local disk | AWS S3 |
| DB | Docker (localhost:5433) | Managed PostgreSQL (RDS / Supabase / Neon) |

---

### 1. Provision infrastructure

**PostgreSQL (with pgvector):**

- AWS RDS: Use PostgreSQL 16, enable the `pgvector` extension
- Supabase: pgvector is available out of the box
- Neon: pgvector supported, enable in project settings

**S3 bucket:**

- Create an S3 bucket (e.g. `askfolio-prod`)
- Create an IAM user with `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on the bucket
- Note the access key ID and secret

**Compute (backend):**

- Any Node.js-compatible host: Railway, Render, Fly.io, EC2, App Engine
- Minimum: 1 vCPU, 1GB RAM (more for large document loads)
- Port: 3011

**Static hosting (frontend):**

- Build outputs to `frontend/dist/` — serve from any static host
- Vercel, Netlify, Cloudflare Pages, S3 + CloudFront, or nginx

---

### 2. Set production environment variables

On your backend host, set the following env vars:

```env
NODE_ENV=production

DATABASE_URL=postgresql://user:password@your-db-host:5432/askfolio

JWT_SECRET=<long-random-string-min-32-chars>

ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

UPLOAD_DIR=./uploads

S3_REGION=us-east-1
S3_BUCKET=askfolio-prod
S3_ACCESS_KEY_ID=<iam-access-key>
S3_SECRET_ACCESS_KEY=<iam-secret>

MAX_CHUNK_SIZE=400
CHUNK_OVERLAP=50
VECTOR_DIMENSIONS=1536
RETRIEVAL_TOP_K=20
HISTORY_MESSAGE_LIMIT=10
SUMMARISE_AFTER=20
```

> **Critical:** `VECTOR_DIMENSIONS=1536` must be set **before** running migrations in production. The embedding column width is fixed at table creation time. If you previously ran migrations with 768 dimensions, you must drop and recreate the `document_chunks` table (or recreate the DB).

---

### 3. Run database migrations

From the backend directory on your production server (or from your local machine pointing at the prod DB):

```bash
DATABASE_URL=<prod-url> npm run db:setup
```

Verify the schema was created:

```sql
\d document_chunks
-- should show embedding vector(1536)
```

---

### 4. Build and deploy backend

```bash
cd backend
npm install --omit=dev
npm start
```

For process management use PM2:

```bash
npm install -g pm2
pm2 start src/index.js --name askfolio-backend
pm2 save
pm2 startup
```

Or deploy as a Docker container — write a Dockerfile:

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY src ./src
EXPOSE 3011
CMD ["node", "src/index.js"]
```

---

### 5. Build and deploy frontend

```bash
cd frontend
npm install
npm run build
# dist/ is the output
```

Set the API base URL before building if the backend is not on the same origin. In `frontend/src/api/index.js`, the client uses `/api` (relative), so you need a reverse proxy or set `VITE_API_BASE_URL` if your setup requires it.

**Serving with nginx:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/askfolio/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3011;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;

        # Required for SSE streaming
        proxy_buffering off;
        proxy_cache off;
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding on;
    }
}
```

> The `proxy_buffering off` settings are required — chat responses are Server-Sent Events (streaming). Without this, nginx will buffer and the UI won't receive tokens in real-time.

---

### 6. CORS / same-origin

If the frontend and backend are on the same domain (via nginx proxy), no CORS config is needed. If they are on different domains, add the frontend origin to Fastify's CORS config in `backend/src/app.js`.

---

### 7. Verify production

```bash
curl https://yourdomain.com/health
# {"status":"ok"}

curl -X POST https://yourdomain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"testpass123","name":"Test"}'
```

---

### Production checklist

- [ ] `NODE_ENV=production` is set
- [ ] `VECTOR_DIMENSIONS=1536` before first migration
- [ ] `JWT_SECRET` is a strong random value (not the default)
- [ ] `ANTHROPIC_API_KEY` and `OPENAI_API_KEY` are set
- [ ] S3 bucket created and IAM credentials have correct permissions
- [ ] PostgreSQL has pgvector extension enabled
- [ ] nginx `proxy_buffering off` for `/api` routes (SSE requirement)
- [ ] HTTPS enabled (TLS cert via Let's Encrypt / managed cert)
- [ ] Backend running under process manager (PM2 / systemd / Docker)

---

### Embedding dimension mismatch

If you have documents already ingested with 768-dim embeddings (local dev) and switch to 1536-dim (production OpenAI), the similarity search will fail. You must re-ingest:

```sql
DELETE FROM document_chunks;
UPDATE documents SET status = 'pending';
```

Then re-upload documents, or add a script to re-trigger ingestion for existing document files.
