import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'
import { users } from './users.js'

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  filePath: text('file_path').notNull(),
  status: text('status').notNull().default('processing'),
  createdAt: timestamp('created_at').defaultNow(),
})
