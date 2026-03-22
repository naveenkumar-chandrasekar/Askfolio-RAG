import { describe, it, expect } from 'vitest'
import { cleanText } from '../../src/lib/textCleaner.js'

describe('cleanText', () => {
  it('trims leading and trailing whitespace', () => {
    expect(cleanText('  hello  ')).toBe('hello')
  })

  it('collapses multiple spaces to one', () => {
    expect(cleanText('hello   world')).toBe('hello world')
  })

  it('normalises CRLF to LF', () => {
    expect(cleanText('line1\r\nline2')).toBe('line1\nline2')
  })

  it('collapses 3+ newlines to double newline', () => {
    expect(cleanText('a\n\n\n\nb')).toBe('a\n\nb')
  })

  it('strips non-printable control characters', () => {
    const text = 'hello\x00\x01world'
    expect(cleanText(text)).toBe('helloworld')
  })

  it('preserves unicode letters', () => {
    expect(cleanText('café résumé')).toBe('café résumé')
  })

  it('returns empty string for whitespace-only input', () => {
    expect(cleanText('   \n\t  ')).toBe('')
  })
})
