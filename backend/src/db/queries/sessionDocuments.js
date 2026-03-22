import { eq, and } from 'drizzle-orm'
import { sessionDocuments } from '../schemas/sessionDocuments.js'
import { documents } from '../schemas/documents.js'

export function makeSessionDocumentQueries(db) {
  return {
    add: (data) => db.insert(sessionDocuments).values(data).onConflictDoNothing(),
    remove: (sessionId, documentId) => db.delete(sessionDocuments).where(and(eq(sessionDocuments.sessionId, sessionId), eq(sessionDocuments.documentId, documentId))),
    findBySession: (sessionId) =>
      db.select({ document: documents }).from(sessionDocuments)
        .innerJoin(documents, eq(sessionDocuments.documentId, documents.id))
        .where(eq(sessionDocuments.sessionId, sessionId)),
    getDocumentIds: async (sessionId) => {
      const rows = await db.select({ documentId: sessionDocuments.documentId }).from(sessionDocuments).where(eq(sessionDocuments.sessionId, sessionId))
      return rows.map(r => r.documentId)
    },
    deleteBySession: (sessionId) => db.delete(sessionDocuments).where(eq(sessionDocuments.sessionId, sessionId)),
    deleteByDocument: (documentId) => db.delete(sessionDocuments).where(eq(sessionDocuments.documentId, documentId)),
  }
}
