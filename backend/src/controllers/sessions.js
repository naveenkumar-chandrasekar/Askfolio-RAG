export async function create(request, reply) {
  const userId = request.user.userId
  const { title, documentIds = [] } = request.body || {}

  const [session] = await this.queries.sessions.create({ userId, title: title || 'New Chat' })

  if (documentIds.length > 0) {
    const rows = documentIds.map(documentId => ({ sessionId: session.id, documentId }))
    await this.queries.sessionDocs.add(rows)
  }

  return reply.code(201).send(session)
}

export async function list(request) {
  return this.queries.sessions.findByUser(request.user.userId)
}

export async function getOne(request, reply) {
  const sessions = await this.queries.sessions.findById(request.params.id, request.user.userId)
  if (sessions.length === 0) return reply.code(404).send({ error: 'Not found' })

  const docs = await this.queries.sessionDocs.findBySession(request.params.id)
  return { ...sessions[0], documents: docs.map(d => d.document) }
}

export async function updateDocuments(request, reply) {
  const sessions = await this.queries.sessions.findById(request.params.id, request.user.userId)
  if (sessions.length === 0) return reply.code(404).send({ error: 'Not found' })

  const { add = [], remove = [] } = request.body || {}

  if (add.length > 0) {
    const rows = add.map(documentId => ({ sessionId: request.params.id, documentId }))
    await this.queries.sessionDocs.add(rows)
  }

  for (const documentId of remove) {
    await this.queries.sessionDocs.remove(request.params.id, documentId)
  }

  return reply.code(200).send({ ok: true })
}

export async function remove(request, reply) {
  const sessions = await this.queries.sessions.findById(request.params.id, request.user.userId)
  if (sessions.length === 0) return reply.code(404).send({ error: 'Not found' })

  await this.queries.messages.deleteBySession(request.params.id)
  await this.queries.sessionDocs.deleteBySession(request.params.id)
  await this.queries.sessions.delete(request.params.id, request.user.userId)

  return reply.code(204).send()
}
