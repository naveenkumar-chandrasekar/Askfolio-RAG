import 'dotenv/config'

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',

  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret',

  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  openaiApiKey: process.env.OPENAI_API_KEY,

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
    llmModel: process.env.OLLAMA_LLM_MODEL || 'qwen2.5:14b',
    embedModel: process.env.OLLAMA_EMBED_MODEL || 'nomic-embed-text',
  },

  uploadDir: process.env.UPLOAD_DIR || './uploads',

  s3: {
    region: process.env.S3_REGION || 'us-east-1',
    bucket: process.env.S3_BUCKET || 'askfolio-dev',
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    endpoint: process.env.LOCALSTACK_ENDPOINT,
  },

  maxChunkSize: parseInt(process.env.MAX_CHUNK_SIZE || '100'),
  chunkOverlap: parseInt(process.env.CHUNK_OVERLAP || '20'),
  vectorDimensions: parseInt(process.env.VECTOR_DIMENSIONS || '768'),
  retrievalTopK: parseInt(process.env.RETRIEVAL_TOP_K || '15'),
  historyMessageLimit: parseInt(process.env.HISTORY_MESSAGE_LIMIT || '10'),
  summariseAfter: parseInt(process.env.SUMMARISE_AFTER || '20'),
}
