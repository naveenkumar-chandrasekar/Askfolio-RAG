import { pgTable, uuid, timestamp } from 'drizzle-orm/pg-core'
import { chatSessions } from './sessions.js'
import { documents } from './documents.js'

export const sessionDocuments = pgTable('session_documents', {
  sessionId: uuid('session_id').notNull().references(() => chatSessions.id),
  documentId: uuid('document_id').notNull().references(() => documents.id),
  addedAt: timestamp('added_at').defaultNow(),
})
