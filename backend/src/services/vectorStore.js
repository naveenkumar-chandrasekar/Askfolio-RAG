import { embedOne } from '../lib/embedding.js'
import { config } from '../config.js'

export async function similaritySearch(queries, question, userId, documentIds) {
  if (documentIds.length === 0) return []

  const embedding = await embedOne(question)
  const [vectorResults, ftsResults] = await Promise.all([
    queries.chunks.similaritySearch(embedding, userId, documentIds, config.retrievalTopK),
    queries.chunks.fullTextSearch(question, userId, documentIds, config.retrievalTopK).catch(() => []),
  ])

  const seen = new Set()
  const merged = []

  for (const chunk of [...vectorResults, ...ftsResults]) {
    const key = chunk.text.slice(0, 60)
    if (!seen.has(key)) {
      seen.add(key)
      merged.push(chunk)
    }
  }

  return merged.slice(0, config.retrievalTopK)
}
