import { similaritySearch } from '../services/vectorStore.js'
import { loadHistory, maybeSummarise } from '../services/history.js'
import { buildPrompt } from '../services/promptBuilder.js'
import { streamResponse } from '../lib/llm.js'

export async function streamChat(request, reply) {
  const userId = request.user.userId
  const { sessionId } = request.params
  const { question } = request.body

  if (!question) return reply.code(400).send({ error: 'question is required' })

  const sessions = await this.queries.sessions.findById(sessionId, userId)
  if (sessions.length === 0) return reply.code(404).send({ error: 'Session not found' })

  const session = sessions[0]

  reply.raw.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  })

  const sendEvent = (type, data) => {
    reply.raw.write(`data: ${JSON.stringify({ type, ...data })}\n\n`)
  }

  try {
    let documentIds = await this.queries.sessionDocs.getDocumentIds(sessionId)
    if (documentIds.length === 0) {
      const allReady = await this.queries.documents.findReadyIdsByUser(userId)
      documentIds = allReady.map(d => d.id)
    }
    const chunks = documentIds.length > 0
      ? await similaritySearch(this.queries, question, userId, documentIds)
      : []

    const messages = await loadHistory(this.queries, sessionId)

    const prompt = buildPrompt({
      question,
      chunks,
      messages,
      summaryContext: session.summaryContext,
    })

    let fullResponse = ''
    for await (const token of streamResponse(prompt)) {
      fullResponse += token
      sendEvent('token', { text: token })
    }

    const seenPreviews = new Set()
    const sources = []
    for (const c of chunks) {
      const cleanText = c.text.replace(/\s+/g, ' ').trim()
      const key = `${c.fileName}:${c.pageNumber}:${cleanText.slice(0, 60)}`
      if (seenPreviews.has(key)) continue
      seenPreviews.add(key)
      sources.push({
        id: c.id,
        fileName: c.fileName,
        pageNumber: c.pageNumber,
        preview: cleanText.slice(0, 200),
      })
      if (sources.length === 5) break
    }

    sendEvent('sources', { sources })

    await this.queries.messages.create({ sessionId, role: 'user', content: question })
    await this.queries.messages.create({
      sessionId,
      role: 'assistant',
      content: fullResponse,
      retrievedChunkIds: JSON.stringify(chunks.slice(0, 5).map(c => c.id)),
    })

    await this.queries.sessions.updateTimestamp(sessionId)

    sendEvent('done', {})

    maybeSummarise(this.queries, sessionId).catch(err => {
      this.log.error({ err, sessionId }, 'Summarisation failed')
    })
  } catch (err) {
    this.log.error(err)
    sendEvent('error', { message: err.message })
  } finally {
    reply.raw.end()
  }
}

export async function getMessages(request, reply) {
  const sessions = await this.queries.sessions.findById(request.params.sessionId, request.user.userId)
  if (sessions.length === 0) return reply.code(404).send({ error: 'Session not found' })

  return this.queries.messages.findBySession(request.params.sessionId)
}
