import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { buildApp } from '../../src/app.js'
import { makeMockQueries, mockDbPlugin, registerAndLogin } from '../helpers/mockDb.js'

function buildMultipart(boundary, fieldName, filename, contentType, content) {
  const body = [
    `--${boundary}`,
    `Content-Disposition: form-data; name="${fieldName}"; filename="${filename}"`,
    `Content-Type: ${contentType}`,
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n')
  return Buffer.from(body)
}

vi.mock('../../src/services/ingestion.js', () => ({
  ingestDocument: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('../../src/lib/storage.js', () => ({
  uploadFile: vi.fn().mockResolvedValue(undefined),
  deleteFile: vi.fn().mockResolvedValue(undefined),
  buildS3Key: vi.fn((userId, fileName) => `${userId}/${fileName}`),
}))

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
  vi.clearAllMocks()
})

describe('GET /api/documents', () => {
  it('returns empty list initially', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/documents',
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual([])
  })

  it('returns 401 without auth', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/documents' })
    expect(res.statusCode).toBe(401)
  })
})

describe('POST /api/documents/upload', () => {
  it('accepts a file and returns processing status', async () => {
    const boundary = 'testboundary123'
    const body = buildMultipart(boundary, 'file', 'test.txt', 'text/plain', 'hello world document content')

    const res = await app.inject({
      method: 'POST',
      url: '/api/documents/upload',
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      body,
    })

    expect(res.statusCode).toBe(202)
    const resBody = res.json()
    expect(resBody.id).toBeTruthy()
    expect(resBody.status).toBe('processing')
  })

  it('returns 400 with no file', async () => {
    const boundary = 'emptyboundary'
    const res = await app.inject({
      method: 'POST',
      url: '/api/documents/upload',
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      body: Buffer.from(`--${boundary}--\r\n`),
    })
    expect(res.statusCode).toBe(400)
  })
})

describe('DELETE /api/documents/:id', () => {
  it('deletes existing document', async () => {
    const boundary = 'delboundary'
    const upload = await app.inject({
      method: 'POST',
      url: '/api/documents/upload',
      headers: {
        Authorization: `Bearer ${token}`,
        'content-type': `multipart/form-data; boundary=${boundary}`,
      },
      body: buildMultipart(boundary, 'file', 'del.txt', 'text/plain', 'some content'),
    })
    const { id } = upload.json()

    const res = await app.inject({
      method: 'DELETE',
      url: `/api/documents/${id}`,
      headers: { Authorization: `Bearer ${token}` },
    })

    expect(res.statusCode).toBe(204)
  })

  it('returns 404 for non-existent document', async () => {
    const res = await app.inject({
      method: 'DELETE',
      url: `/api/documents/${crypto.randomUUID()}`,
      headers: { Authorization: `Bearer ${token}` },
    })
    expect(res.statusCode).toBe(404)
  })
})
