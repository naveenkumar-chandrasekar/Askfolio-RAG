import { config } from '../config.js'

const SYSTEM_INSTRUCTION = `You are a document Q&A assistant. You only answer questions about the documents provided.

STRICT RULES — follow exactly:
1. Start your reply with the answer immediately. Zero preamble.
2. NEVER begin with "I apologize", "I'm sorry", "Unfortunately", "Based on", or any similar phrase.
3. NEVER include inline citations like [Source 1: ...] or [Source N: ...] in your answer.
4. Answer only from the document excerpts below. Do not use outside knowledge.
5. Quote exact numbers, dates, and facts from the excerpts — never paraphrase specifics as "many" or "approximately".
6. If the question is not related to the documents, respond with: "I can only answer questions about the uploaded documents."
7. Never engage with personal questions, opinions, predictions, or topics outside the document content.`

export function buildPrompt({ question, chunks, messages, summaryContext }) {
  const parts = [SYSTEM_INSTRUCTION, '']

  if (summaryContext) {
    parts.push('## Summary of earlier conversation')
    parts.push(summaryContext)
    parts.push('')
  }

  if (chunks.length > 0) {
    parts.push('## Relevant document excerpts')
    const topChunks = chunks.slice(0, 15)
    topChunks.forEach((chunk, i) => {
      parts.push(`[Source ${i + 1}: ${chunk.fileName}, page ${chunk.pageNumber ?? 'N/A'}]`)
      parts.push(chunk.text)
      parts.push('')
    })
  } else {
    parts.push('## Note')
    parts.push('No documents are available. Please upload a document first.')
    parts.push('')
  }

  const recentMessages = messages.slice(-config.historyMessageLimit)
  if (recentMessages.length > 0) {
    parts.push('## Conversation history')
    recentMessages.forEach(m => {
      parts.push(`${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    })
    parts.push('')
  }

  parts.push(`## Current question`)
  parts.push(`User: ${question}`)
  parts.push('Assistant:')

  return parts.join('\n')
}
