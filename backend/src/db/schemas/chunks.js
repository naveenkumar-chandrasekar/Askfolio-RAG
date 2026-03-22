import { pgTable, uuid, text, integer, timestamp, index } from 'drizzle-orm/pg-core'
import { customType } from 'drizzle-orm/pg-core'
import { config } from '../../config.js'
import { documents } from './documents.js'

const vector = customType({
  dataType(config) {
    return `vector(${config?.dimensions ?? 768})`
  },
})

export const documentChunks = pgTable('document_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  documentId: uuid('document_id').notNull().references(() => documents.id),
  userId: uuid('user_id').notNull(),
  chunkIndex: integer('chunk_index').notNull(),
  pageNumber: integer('page_number'),
  text: text('text').notNull(),
  embedding: vector('embedding', { dimensions: config.vectorDimensions }),
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  embeddingIdx: index('embedding_idx').using('hnsw', table.embedding.op('vector_cosine_ops')),
}))
