import JSZip from 'jszip'
import { XMLParser } from 'fast-xml-parser'
import fs from 'fs/promises'

const parser = new XMLParser({ ignoreAttributes: false, textNodeName: '_text' })

function extractText(node) {
  if (typeof node === 'string') return node
  if (typeof node !== 'object' || node === null) return ''
  const texts = []
  for (const [key, value] of Object.entries(node)) {
    if (key === '_text') texts.push(String(value))
    else if (Array.isArray(value)) value.forEach(v => texts.push(extractText(v)))
    else texts.push(extractText(value))
  }
  return texts.join(' ')
}

export async function parsePptx(filePath) {
  const buffer = await fs.readFile(filePath)
  const zip = await JSZip.loadAsync(buffer)
  const pages = []

  const slideFiles = Object.keys(zip.files)
    .filter(name => name.match(/^ppt\/slides\/slide\d+\.xml$/))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)[0])
      const numB = parseInt(b.match(/\d+/)[0])
      return numA - numB
    })

  for (let i = 0; i < slideFiles.length; i++) {
    const xml = await zip.files[slideFiles[i]].async('string')
    const parsed = parser.parse(xml)
    const text = extractText(parsed).replace(/\s+/g, ' ').trim()
    if (text.length > 0) {
      pages.push({ pageNumber: i + 1, text })
    }
  }

  return pages
}
