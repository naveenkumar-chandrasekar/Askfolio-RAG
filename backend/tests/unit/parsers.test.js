import { describe, it, expect } from 'vitest'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'
import { parseText } from '../../src/lib/parsers/text.js'
import { parseFile } from '../../src/lib/parsers/index.js'

async function writeTmp(name, content) {
  const filePath = path.join(os.tmpdir(), name)
  await fs.writeFile(filePath, content)
  return filePath
}

describe('parseText', () => {
  it('returns pages with text content', async () => {
    const filePath = await writeTmp('test.txt', 'Hello world\nThis is a test document.')
    const pages = await parseText(filePath)
    expect(pages.length).toBeGreaterThan(0)
    expect(pages[0].pageNumber).toBe(1)
    expect(pages[0].text).toContain('Hello world')
  })

  it('splits large text into multiple pages', async () => {
    const bigText = 'word '.repeat(2000)
    const filePath = await writeTmp('big.txt', bigText)
    const pages = await parseText(filePath)
    expect(pages.length).toBeGreaterThan(1)
  })

  it('returns empty array for empty file', async () => {
    const filePath = await writeTmp('empty.txt', '')
    const pages = await parseText(filePath)
    expect(pages).toHaveLength(0)
  })
})

describe('parseFile', () => {
  it('routes txt by mime type', async () => {
    const filePath = await writeTmp('sample.txt', 'content here')
    const pages = await parseFile(filePath, 'text/plain')
    expect(pages[0].text).toContain('content here')
  })

  it('routes md by mime type', async () => {
    const filePath = await writeTmp('sample.md', '# Title\nBody text')
    const pages = await parseFile(filePath, 'text/markdown')
    expect(pages[0].text).toContain('Title')
  })

  it('throws for unsupported mime type', async () => {
    const filePath = await writeTmp('sample.bin', 'data')
    await expect(parseFile(filePath, 'application/octet-stream')).rejects.toThrow('Unsupported')
  })
})
