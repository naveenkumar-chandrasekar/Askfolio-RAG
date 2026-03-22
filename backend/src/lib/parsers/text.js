import fs from 'fs/promises'

const PAGE_SIZE = 3000

export async function parseText(filePath) {
  const content = await fs.readFile(filePath, 'utf-8')
  const text = content.trim()
  const pages = []

  for (let i = 0; i < text.length; i += PAGE_SIZE) {
    pages.push({
      pageNumber: Math.floor(i / PAGE_SIZE) + 1,
      text: text.slice(i, i + PAGE_SIZE).trim(),
    })
  }

  return pages
}
