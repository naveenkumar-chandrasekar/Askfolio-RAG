import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const pdfParse = require('pdf-parse')
import fs from 'fs/promises'

export async function parsePdf(filePath) {
  const buffer = await fs.readFile(filePath)
  const pageTexts = []

  await pdfParse(buffer, {
    pagerender: (pageData) => {
      return pageData.getTextContent().then(tc => {
        const text = tc.items.map(i => i.str).join(' ')
        pageTexts.push(text)
        return text
      })
    }
  })

  const pages = pageTexts
    .map((text, i) => ({ pageNumber: i + 1, text: text.trim() }))
    .filter(p => p.text.length > 0)

  if (pages.length === 0) {
    const data = await pdfParse(buffer)
    if (data.text.trim()) pages.push({ pageNumber: 1, text: data.text.trim() })
  }

  return pages
}
