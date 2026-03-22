export function cleanText(text) {
  return text
    .replace(/[^\x20-\x7E\n\r\t\u00A0-\uFFFF]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}
