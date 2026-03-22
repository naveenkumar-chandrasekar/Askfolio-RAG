import path from 'path'
import { parsePdf } from './pdf.js'
import { parseDocx } from './docx.js'
import { parsePptx } from './pptx.js'
import { parseSheet } from './sheet.js'
import { parseText } from './text.js'
import { parseImage } from './image.js'

const MIME_MAP = {
  'application/pdf': parsePdf,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': parseDocx,
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': parsePptx,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': parseSheet,
  'text/csv': parseSheet,
  'text/plain': parseText,
  'text/markdown': parseText,
  'image/png': parseImage,
  'image/jpeg': parseImage,
  'image/jpg': parseImage,
  'image/gif': parseImage,
  'image/webp': parseImage,
}

const EXT_MAP = {
  '.pdf': parsePdf,
  '.docx': parseDocx,
  '.pptx': parsePptx,
  '.xlsx': parseSheet,
  '.csv': parseSheet,
  '.txt': parseText,
  '.md': parseText,
  '.png': parseImage,
  '.jpg': parseImage,
  '.jpeg': parseImage,
  '.gif': parseImage,
  '.webp': parseImage,
}

export async function parseFile(filePath, mimeType) {
  let parser = MIME_MAP[mimeType]
  if (!parser) {
    const ext = path.extname(filePath).toLowerCase()
    parser = EXT_MAP[ext]
  }
  if (!parser) throw new Error(`Unsupported file type: ${mimeType}`)
  return parser(filePath)
}
