import mammoth from 'mammoth'

const PAGE_SIZE = 3000

export async function parseDocx(filePath) {
  const result = await mammoth.extractRawText({ path: filePath })
  const text = result.value.trim()

  const pages = []
  for (let i = 0; i < text.length; i += PAGE_SIZE) {
    pages.push({
      pageNumber: Math.floor(i / PAGE_SIZE) + 1,
      text: text.slice(i, i + PAGE_SIZE).trim(),
    })
  }

  return pages
}
