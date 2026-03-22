import fp from 'fastify-plugin'

export function makeMockQueries(overrides = {}) {
  const store = {
    users: [],
    documents: [],
    chunks: [],
    sessions: [],
    messages: [],
    sessionDocs: [],
  }

  const defaults = {
    users: {
      findByEmail: async (email) => store.users.filter((u) => u.email === email),
      create: async (data) => {
        const user = { id: crypto.randomUUID(), createdAt: new Date(), name: '', ...data }
        store.users.push(user)
        return [user]
      },
      findById: async (id) => store.users.filter((u) => u.id === id),
      updateById: async (id, data) => {
        const idx = store.users.findIndex((u) => u.id === id)
        if (idx !== -1) Object.assign(store.users[idx], data)
        return [store.users[idx]]
      },
    },
    documents: {
      create: async (data) => {
        const doc = { id: crypto.randomUUID(), createdAt: new Date(), status: 'processing', ...data }
        store.documents.push(doc)
        return [doc]
      },
      findByUser: async (userId) => store.documents.filter((d) => d.userId === userId),
      findById: async (id, userId) =>
        store.documents.filter((d) => d.id === id && d.userId === userId),
      findReadyIdsByUser: async (userId) =>
        store.documents.filter((d) => d.userId === userId && d.status === 'ready').map((d) => ({ id: d.id })),
      updateStatus: async (id, status) => {
        const doc = store.documents.find((d) => d.id === id)
        if (doc) doc.status = status
      },
      delete: async (id, userId) => {
        const idx = store.documents.findIndex((d) => d.id === id && d.userId === userId)
        if (idx !== -1) store.documents.splice(idx, 1)
      },
    },
    chunks: {
      bulkCreate: async (rows) => store.chunks.push(...rows),
      deleteByDocument: async (documentId) => {
        store.chunks = store.chunks.filter((c) => c.documentId !== documentId)
      },
      similaritySearch: async () => [],
      fullTextSearch: async () => [],
      findByIds: async (ids) => store.chunks.filter((c) => ids.includes(c.id)),
    },
    sessions: {
      create: async (data) => {
        const s = { id: crypto.randomUUID(), createdAt: new Date(), updatedAt: new Date(), title: 'New Chat', summaryContext: null, ...data }
        store.sessions.push(s)
        return [s]
      },
      findByUser: async (userId) => store.sessions.filter((s) => s.userId === userId),
      findById: async (id, userId) =>
        store.sessions.filter((s) => s.id === id && s.userId === userId),
      updateTimestamp: async () => {},
      updateSummary: async () => {},
      delete: async (id, userId) => {
        const idx = store.sessions.findIndex((s) => s.id === id && s.userId === userId)
        if (idx !== -1) store.sessions.splice(idx, 1)
      },
    },
    messages: {
      create: async (data) => {
        const m = { id: crypto.randomUUID(), createdAt: new Date(), ...data }
        store.messages.push(m)
        return [m]
      },
      findBySession: async (sessionId) =>
        store.messages.filter((m) => m.sessionId === sessionId),
      findRecentBySession: async (sessionId, limit = 20) =>
        store.messages.filter((m) => m.sessionId === sessionId).slice(-limit),
      countBySession: async (sessionId) => [{ count: store.messages.filter((m) => m.sessionId === sessionId).length }],
      deleteBySession: async (sessionId) => {
        store.messages = store.messages.filter((m) => m.sessionId !== sessionId)
      },
      deleteOlderThan: async () => {},
    },
    sessionDocs: {
      add: async (data) => store.sessionDocs.push(data),
      remove: async (sessionId, documentId) => {
        store.sessionDocs = store.sessionDocs.filter(
          (s) => !(s.sessionId === sessionId && s.documentId === documentId)
        )
      },
      findBySession: async (sessionId) => {
        const docIds = store.sessionDocs.filter((s) => s.sessionId === sessionId).map((s) => s.documentId)
        return store.documents.filter((d) => docIds.includes(d.id)).map((d) => ({ document: d }))
      },
      getDocumentIds: async (sessionId) =>
        store.sessionDocs.filter((s) => s.sessionId === sessionId).map((s) => s.documentId),
      deleteBySession: async (sessionId) => {
        store.sessionDocs = store.sessionDocs.filter((s) => s.sessionId !== sessionId)
      },
      deleteByDocument: async (documentId) => {
        store.sessionDocs = store.sessionDocs.filter((s) => s.documentId !== documentId)
      },
    },
  }

  const merged = {}
  for (const key of Object.keys(defaults)) {
    merged[key] = { ...defaults[key], ...(overrides[key] || {}) }
  }

  merged._store = store
  return merged
}

export function mockDbPlugin(queries) {
  return fp(async (fastify) => {
    fastify.decorate('db', {})
    fastify.decorate('queries', queries)
  })
}

export async function registerAndLogin(app, { email = 'test@example.com', password = 'password123', name = 'Test User' } = {}) {
  const reg = await app.inject({
    method: 'POST',
    url: '/api/auth/register',
    body: { email, password, name },
  })
  const { token, userId } = JSON.parse(reg.body)
  return { token, userId }
}
