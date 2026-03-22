import { eq, and, desc } from 'drizzle-orm'
import { documents } from '../schemas/documents.js'

export function makeDocumentQueries(db) {
  return {
    create: (data) => db.insert(documents).values(data).returning(),
    findByUser: (userId) => db.select().from(documents).where(eq(documents.userId, userId)).orderBy(desc(documents.createdAt)),
    findReadyIdsByUser: (userId) => db.select({ id: documents.id }).from(documents).where(and(eq(documents.userId, userId), eq(documents.status, 'ready'))),
    findById: (id, userId) => db.select().from(documents).where(and(eq(documents.id, id), eq(documents.userId, userId))).limit(1),
    updateStatus: (id, status) => db.update(documents).set({ status }).where(eq(documents.id, id)),
    delete: (id, userId) => db.delete(documents).where(and(eq(documents.id, id), eq(documents.userId, userId))),
  }
}
