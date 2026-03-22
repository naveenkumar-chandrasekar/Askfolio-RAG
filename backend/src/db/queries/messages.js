import { eq, asc, desc, sql } from 'drizzle-orm'
import { chatMessages } from '../schemas/messages.js'

export function makeMessageQueries(db) {
  return {
    create: (data) => db.insert(chatMessages).values(data).returning(),
    findBySession: (sessionId) => db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(asc(chatMessages.createdAt)),
    findRecentBySession: (sessionId, limit = 20) => db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(desc(chatMessages.createdAt)).limit(limit),
    countBySession: (sessionId) => db.select({ count: sql`count(*)` }).from(chatMessages).where(eq(chatMessages.sessionId, sessionId)),
    deleteOlderThan: (sessionId, keepCount) =>
      db.execute(sql`DELETE FROM chat_messages WHERE session_id = ${sessionId} AND id NOT IN (SELECT id FROM chat_messages WHERE session_id = ${sessionId} ORDER BY created_at DESC LIMIT ${keepCount})`),
    deleteBySession: (sessionId) => db.delete(chatMessages).where(eq(chatMessages.sessionId, sessionId)),
  }
}
