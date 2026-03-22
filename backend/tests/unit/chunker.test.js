import { describe, it, expect } from 'vitest'
import { chunkText, chunkPages } from '../../src/lib/chunker.js'

describe('chunkText', () => {
  it('returns single chunk for short text', () => {
    const chunks = chunkText('Hello world', 1)
    expect(chunks).toHaveLength(1)
    expect(chunks[0].text).toBe('Hello world')
    expect(chunks[0].pageNumber).toBe(1)
  })

  it('splits long text into multiple chunks', () => {
    const word = 'word '
    const longText = word.repeat(200)
    const chunks = chunkText(longText, 1)
    expect(chunks.length).toBeGreaterThan(1)
  })

  it('assigns sequential chunkIndex', () => {
    const longText = 'word '.repeat(200)
    const chunks = chunkText(longText, 1)
    chunks.forEach((c, i) => expect(c.chunkIndex).toBe(i))
  })

  it('preserves pageNumber', () => {
    const chunks = chunkText('some text', 5)
    expect(chunks[0].pageNumber).toBe(5)
  })
})

describe('chunkPages', () => {
  it('combines chunks from multiple pages', () => {
    const pages = [
      { pageNumber: 1, text: 'page one content' },
      { pageNumber: 2, text: 'page two content' },
    ]
    const chunks = chunkPages(pages)
    expect(chunks.length).toBeGreaterThanOrEqual(2)
    const page1Chunks = chunks.filter((c) => c.pageNumber === 1)
    const page2Chunks = chunks.filter((c) => c.pageNumber === 2)
    expect(page1Chunks.length).toBeGreaterThan(0)
    expect(page2Chunks.length).toBeGreaterThan(0)
  })

  it('assigns globally sequential chunkIndex across pages', () => {
    const pages = [
      { pageNumber: 1, text: 'word '.repeat(100) },
      { pageNumber: 2, text: 'word '.repeat(100) },
    ]
    const chunks = chunkPages(pages)
    chunks.forEach((c, i) => expect(c.chunkIndex).toBe(i))
  })

  it('returns empty array for empty pages', () => {
    expect(chunkPages([])).toEqual([])
  })
})
