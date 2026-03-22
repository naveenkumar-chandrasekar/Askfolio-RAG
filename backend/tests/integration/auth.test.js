import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildApp } from '../../src/app.js'
import { makeMockQueries, mockDbPlugin } from '../helpers/mockDb.js'

let app
let queries

beforeEach(async () => {
  queries = makeMockQueries()
  app = await buildApp({ dbPlugin: mockDbPlugin(queries) })
  await app.ready()
})

afterEach(async () => {
  await app.close()
})

describe('POST /api/auth/register', () => {
  it('registers a new user and returns token', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      body: { email: 'user@example.com', password: 'secret123', name: 'Alice' },
    })

    expect(res.statusCode).toBe(201)
    const body = res.json()
    expect(body.token).toBeTruthy()
    expect(body.userId).toBeTruthy()
    expect(body.name).toBe('Alice')
  })

  it('returns 400 when email is missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      body: { password: 'secret' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('returns 409 when email already registered', async () => {
    const body = { email: 'dup@example.com', password: 'secret', name: 'Bob' }
    await app.inject({ method: 'POST', url: '/api/auth/register', body })
    const res = await app.inject({ method: 'POST', url: '/api/auth/register', body })
    expect(res.statusCode).toBe(409)
  })
})

describe('POST /api/auth/login', () => {
  it('returns token for valid credentials', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      body: { email: 'login@example.com', password: 'mypass', name: 'Login User' },
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'login@example.com', password: 'mypass' },
    })

    expect(res.statusCode).toBe(200)
    const body = res.json()
    expect(body.token).toBeTruthy()
  })

  it('returns 401 for wrong password', async () => {
    await app.inject({
      method: 'POST',
      url: '/api/auth/register',
      body: { email: 'fail@example.com', password: 'correct', name: 'User' },
    })

    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'fail@example.com', password: 'wrong' },
    })

    expect(res.statusCode).toBe(401)
  })

  it('returns 401 for unknown email', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/auth/login',
      body: { email: 'nobody@example.com', password: 'pass' },
    })
    expect(res.statusCode).toBe(401)
  })
})
