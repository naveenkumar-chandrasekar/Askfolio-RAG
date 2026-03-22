const BASE = '/api'

function getToken() {
  return localStorage.getItem('token')
}

async function req(method, path, body) {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }))
    throw new Error(err.error || 'Request failed')
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  auth: {
    register: (email, password, name) => req('POST', '/auth/register', { email, password, name }),
    login: (email, password) => req('POST', '/auth/login', { email, password }),
  },

  users: {
    me: () => req('GET', '/users/me'),
    update: (data) => req('PUT', '/users/me', data),
  },

  documents: {
    upload(file) {
      const token = getToken()
      const form = new FormData()
      form.append('file', file)
      return fetch(`${BASE}/documents/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      }).then(async r => {
        const data = await r.json().catch(() => ({ error: r.statusText }))
        if (!r.ok) throw new Error(data.error || 'Upload failed')
        return data
      })
    },
    list: () => req('GET', '/documents'),
    get: (id) => req('GET', `/documents/${id}`),
    delete: (id) => req('DELETE', `/documents/${id}`),
  },

  sessions: {
    create: (title, documentIds = []) => req('POST', '/sessions', { title, documentIds }),
    list: () => req('GET', '/sessions'),
    get: (id) => req('GET', `/sessions/${id}`),
    updateDocuments: (id, add = [], remove = []) => req('PUT', `/sessions/${id}/documents`, { add, remove }),
    delete: (id) => req('DELETE', `/sessions/${id}`),
  },

  chat: {
    messages: (sessionId) => req('GET', `/chat/${sessionId}/messages`),
    streamChat(sessionId, question, onToken, onSources, onDone, onError) {
      const token = getToken()
      return fetch(`${BASE}/chat/${sessionId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question }),
      }).then(async res => {
        if (!res.ok) throw new Error('Chat request failed')
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop()

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === 'token') onToken(data.text)
              else if (data.type === 'sources') onSources(data.sources)
              else if (data.type === 'done') onDone()
              else if (data.type === 'error') onError(new Error(data.message))
            } catch {}
          }
        }
      }).catch(onError)
    },
  },
}
