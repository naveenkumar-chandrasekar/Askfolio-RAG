import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildApp } from '../../src/app.js'
import { makeMockQueries, mockDbPlugin, registerAndLogin } from '../helpers/mockDb.js'

let app
let queries
let token

beforeEach(async () => {
  queries = makeMockQueries()
  app = await buildApp({ dbPlugin: mockDbPlugin(queries) })
  await app.ready()
  ;({ token } = await registerAndLogin(app))
})

afterEach(async () => {
  await app.close()
})

describe('POST /api/sessions', () => {
  it('creates a session', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/sessions',
      headers: { Authorization: `Bearer ${token}` },
      body: { title: 'My Chat' },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.id).toBeTruthy()
    expect(body.title).toBe('My Chat')
  })

  it('returns 401 without auth', async () => {
    const res = await app.inject({ method: 'POST', url: '/api/sessions', body: { title: 'x' } })
    expect(res.statusCode).toBe(401)
  })
})

describe('GET /api/sessions', () => {
  it('returns list of sessions', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/sessions',
      headers: { Authorization: `Bearer ${token}` },
      body: { title: 'Chat 1' },
    })

    const res = await app.inject({
      method: 'GET',
      url: '/api/sessions',
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(Array.isArray(body)).toBe(true)
    expect(body.length).toBe(1)
    expect(body[0].title).toBe('Chat 1')
  })
})

describe('DELETE /api/sessions/:id', () => {
  it('deletes an existing session', async () => {
    const created = await app.inject({
      method: 'POST',
      url: '/api/sessions',
      headers: { Authorization: `Bearer ${token}` },
      body: { title: 'To Delete' },
    })
    const { id } = created.json()

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/sessions/${id}`,
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(204)
    expect(queries._store.sessions).toHaveLength(0)
  })
})
