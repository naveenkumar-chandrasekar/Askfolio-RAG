import XLSX from 'xlsx'

export async function parseSheet(filePath) {
  const workbook = XLSX.readFile(filePath)
  const pages = []

  workbook.SheetNames.forEach((sheetName, i) => {
    const sheet = workbook.Sheets[sheetName]
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' })
    const text = rows.map(row =>
      Object.entries(row).map(([k, v]) => `${k}: ${v}`).join(' | ')
    ).join('\n')

    if (text.trim().length > 0) {
      pages.push({ pageNumber: i + 1, text: text.trim() })
    }
  })

  return pages
}
