import { eq, and, desc } from 'drizzle-orm'
import { chatSessions } from '../schemas/sessions.js'

export function makeSessionQueries(db) {
  return {
    create: (data) => db.insert(chatSessions).values(data).returning(),
    findByUser: (userId) => db.select().from(chatSessions).where(eq(chatSessions.userId, userId)).orderBy(desc(chatSessions.updatedAt)),
    findById: (id, userId) => {
      const where = userId
        ? and(eq(chatSessions.id, id), eq(chatSessions.userId, userId))
        : eq(chatSessions.id, id)
      return db.select().from(chatSessions).where(where).limit(1)
    },
    updateSummary: (id, summaryContext) => db.update(chatSessions).set({ summaryContext, updatedAt: new Date() }).where(eq(chatSessions.id, id)),
    updateTimestamp: (id) => db.update(chatSessions).set({ updatedAt: new Date() }).where(eq(chatSessions.id, id)),
    delete: (id, userId) => db.delete(chatSessions).where(and(eq(chatSessions.id, id), eq(chatSessions.userId, userId))),
  }
}
