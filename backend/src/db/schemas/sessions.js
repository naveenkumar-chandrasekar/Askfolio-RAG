import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users.js'

export const chatSessions = pgTable('chat_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  title: text('title').notNull().default('New Chat'),
  summaryContext: text('summary_context'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
