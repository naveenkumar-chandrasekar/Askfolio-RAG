import { eq, and, inArray, sql } from 'drizzle-orm'
import { documentChunks } from '../schemas/chunks.js'
import { documents } from '../schemas/documents.js'

export function makeChunkQueries(db) {
  return {
    bulkCreate: (data) => db.insert(documentChunks).values(data),
    deleteByDocument: (documentId) => db.delete(documentChunks).where(eq(documentChunks.documentId, documentId)),
    similaritySearch: async (embedding, userId, documentIds, topK = 10) => {
      const embeddingStr = `[${embedding.join(',')}]`
      return db
        .select({
          id: documentChunks.id,
          text: documentChunks.text,
          pageNumber: documentChunks.pageNumber,
          documentId: documentChunks.documentId,
          fileName: documents.fileName,
          distance: sql`${documentChunks.embedding} <=> ${embeddingStr}::vector`,
        })
        .from(documentChunks)
        .innerJoin(documents, eq(documentChunks.documentId, documents.id))
        .where(
          documentIds.length > 0
            ? and(eq(documentChunks.userId, userId), inArray(documentChunks.documentId, documentIds))
            : eq(documentChunks.userId, userId)
        )
        .orderBy(sql`${documentChunks.embedding} <=> ${embeddingStr}::vector`)
        .limit(topK)
    },
    fullTextSearch: async (question, userId, documentIds, topK = 10) => {
      return db
        .select({
          id: documentChunks.id,
          text: documentChunks.text,
          pageNumber: documentChunks.pageNumber,
          documentId: documentChunks.documentId,
          fileName: documents.fileName,
          distance: sql`0.0`,
        })
        .from(documentChunks)
        .innerJoin(documents, eq(documentChunks.documentId, documents.id))
        .where(
          and(
            eq(documentChunks.userId, userId),
            documentIds.length > 0 ? inArray(documentChunks.documentId, documentIds) : sql`true`,
            sql`ts @@ websearch_to_tsquery('english', ${question})`
          )
        )
        .orderBy(sql`ts_rank(ts, websearch_to_tsquery('english', ${question})) DESC`)
        .limit(topK)
    },
    findByIds: (ids) => db.select().from(documentChunks).where(inArray(documentChunks.id, ids)),
  }
}
