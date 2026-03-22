import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { buildApp } from '../../src/app.js'
import { makeMockQueries, mockDbPlugin } from '../helpers/mockDb.js'

let app

beforeEach(async () => {
  app = await buildApp({ dbPlugin: mockDbPlugin(makeMockQueries()) })
  await app.ready()
})

afterEach(async () => {
  await app.close()
})

describe('GET /health', () => {
  it('returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ status: 'ok' })
  })
})
