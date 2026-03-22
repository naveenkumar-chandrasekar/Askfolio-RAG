CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" text NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "documents" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "file_name" text NOT NULL,
  "file_type" text NOT NULL,
  "file_path" text NOT NULL,
  "status" text NOT NULL DEFAULT 'processing',
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "document_chunks" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "document_id" uuid NOT NULL REFERENCES "documents"("id"),
  "user_id" uuid NOT NULL,
  "chunk_index" integer NOT NULL,
  "page_number" integer,
  "text" text NOT NULL,
  "embedding" vector(768),
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "embedding_idx" ON "document_chunks" USING hnsw ("embedding" vector_cosine_ops);

CREATE TABLE IF NOT EXISTS "chat_sessions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id" uuid NOT NULL REFERENCES "users"("id"),
  "title" text NOT NULL DEFAULT 'New Chat',
  "summary_context" text,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "chat_messages" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" uuid NOT NULL REFERENCES "chat_sessions"("id"),
  "role" text NOT NULL,
  "content" text NOT NULL,
  "retrieved_chunk_ids" text,
  "created_at" timestamp DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "session_documents" (
  "session_id" uuid NOT NULL REFERENCES "chat_sessions"("id"),
  "document_id" uuid NOT NULL REFERENCES "documents"("id"),
  "added_at" timestamp DEFAULT now(),
  PRIMARY KEY ("session_id", "document_id")
);
