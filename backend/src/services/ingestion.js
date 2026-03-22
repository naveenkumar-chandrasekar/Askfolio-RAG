import { parseFile } from '../lib/parsers/index.js'
import { cleanText } from '../lib/textCleaner.js'
import { chunkPages } from '../lib/chunker.js'
import { embedBatch } from '../lib/embedding.js'

const EMBED_BATCH_SIZE = 20

export async function ingestDocument(queries, documentId, userId, filePath, mimeType) {
  try {
    await queries.chunks.deleteByDocument(documentId)
    const pages = await parseFile(filePath, mimeType)

    const cleanedPages = pages.map(p => ({ ...p, text: cleanText(p.text) })).filter(p => p.text.length > 0)

    const chunks = chunkPages(cleanedPages)

    for (let i = 0; i < chunks.length; i += EMBED_BATCH_SIZE) {
      const batch = chunks.slice(i, i + EMBED_BATCH_SIZE)
      const texts = batch.map(c => c.text)
      const embeddings = await embedBatch(texts)

      const rows = batch.map((chunk, j) => ({
        documentId,
        userId,
        chunkIndex: chunk.chunkIndex,
        pageNumber: chunk.pageNumber,
        text: chunk.text,
        embedding: JSON.stringify(embeddings[j]),
      }))

      await queries.chunks.bulkCreate(rows)
    }

    await queries.documents.updateStatus(documentId, 'ready')
  } catch (err) {
    await queries.documents.updateStatus(documentId, 'failed')
    throw err
  }
}
