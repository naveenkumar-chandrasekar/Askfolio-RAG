import { generateSummary } from '../lib/llm.js'
import { config } from '../config.js'

export async function loadHistory(queries, sessionId) {
  const messages = await queries.messages.findRecentBySession(sessionId, 20)
  return messages.reverse()
}

export async function maybeSummarise(queries, sessionId) {
  const countResult = await queries.messages.countBySession(sessionId)
  const count = parseInt(countResult[0]?.count || '0')

  if (count <= config.summariseAfter) return

  const allMessages = await queries.messages.findBySession(sessionId)
  const toSummarise = allMessages.slice(0, allMessages.length - 20)

  if (toSummarise.length === 0) return

  const transcript = toSummarise.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')

  const summary = await generateSummary(transcript)

  const session = await queries.sessions.findById(sessionId, null)
  const existing = session[0]?.summaryContext
  const finalSummary = existing ? `${existing}\n\n${summary}` : summary

  await queries.sessions.updateSummary(sessionId, finalSummary)
  await queries.messages.deleteOlderThan(sessionId, 20)
}
