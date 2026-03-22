import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { chatSessions } from './sessions.js'

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  sessionId: uuid('session_id').notNull().references(() => chatSessions.id),
  role: text('role').notNull(),
  content: text('content').notNull(),
  retrievedChunkIds: text('retrieved_chunk_ids'),
  createdAt: timestamp('created_at').defaultNow(),
})
