import { config } from '../config.js'

const SEPARATORS = ['\n\n', '\n', '. ', ' ', '']

function estimateTokens(text) {
  return Math.ceil(text.length / 4)
}

function splitRecursive(text, separators, maxTokens) {
  if (estimateTokens(text) <= maxTokens) return [text]

  const [sep, ...rest] = separators
  if (sep === undefined) return [text]

  const parts = text.split(sep)
  const chunks = []
  let current = ''

  for (const part of parts) {
    const candidate = current ? current + sep + part : part
    if (estimateTokens(candidate) <= maxTokens) {
      current = candidate
    } else {
      if (current) chunks.push(current)
      if (estimateTokens(part) > maxTokens) {
        chunks.push(...splitRecursive(part, rest, maxTokens))
        current = ''
      } else {
        current = part
      }
    }
  }

  if (current) chunks.push(current)
  return chunks
}

export function chunkText(text, pageNumber) {
  const maxTokens = config.maxChunkSize
  const overlapTokens = config.chunkOverlap
  const overlapChars = overlapTokens * 4

  const rawChunks = splitRecursive(text, SEPARATORS, maxTokens)
  const chunks = []

  for (let i = 0; i < rawChunks.length; i++) {
    let chunkText = rawChunks[i].trim()
    if (!chunkText) continue

    if (i > 0) {
      const prevChunk = rawChunks[i - 1]
      const overlap = prevChunk.slice(-overlapChars)
      chunkText = overlap + ' ' + chunkText
    }

    chunks.push({
      text: chunkText.trim(),
      pageNumber,
      chunkIndex: chunks.length,
    })
  }

  return chunks
}

export function chunkPages(pages) {
  const allChunks = []
  for (const page of pages) {
    const pageChunks = chunkText(page.text, page.pageNumber)
    allChunks.push(...pageChunks)
  }
  return allChunks.map((c, i) => ({ ...c, chunkIndex: i }))
}
