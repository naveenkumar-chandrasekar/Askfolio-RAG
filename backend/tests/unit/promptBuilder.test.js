import { describe, it, expect } from 'vitest'
import { buildPrompt } from '../../src/services/promptBuilder.js'

const sampleChunks = [
  { fileName: 'doc.pdf', pageNumber: 1, text: 'Newton defined force as mass times acceleration.' },
  { fileName: 'doc.pdf', pageNumber: 2, text: 'The speed of light is 299,792,458 m/s.' },
]

const sampleMessages = [
  { role: 'user', content: 'What is F=ma?' },
  { role: 'assistant', content: 'F=ma is Newton\'s second law.' },
]

describe('buildPrompt', () => {
  it('includes the question', () => {
    const prompt = buildPrompt({ question: 'What is gravity?', chunks: [], messages: [] })
    expect(prompt).toContain('What is gravity?')
  })

  it('includes chunk text when chunks provided', () => {
    const prompt = buildPrompt({ question: 'q', chunks: sampleChunks, messages: [] })
    expect(prompt).toContain('Newton defined force')
    expect(prompt).toContain('299,792,458')
  })

  it('includes file names in chunk source labels', () => {
    const prompt = buildPrompt({ question: 'q', chunks: sampleChunks, messages: [] })
    expect(prompt).toContain('doc.pdf')
  })

  it('shows no-document note when no chunks', () => {
    const prompt = buildPrompt({ question: 'q', chunks: [], messages: [] })
    expect(prompt).toContain('No documents')
  })

  it('includes conversation history', () => {
    const prompt = buildPrompt({ question: 'q', chunks: [], messages: sampleMessages })
    expect(prompt).toContain('What is F=ma?')
    expect(prompt).toContain("Newton's second law")
  })

  it('includes summary context when provided', () => {
    const prompt = buildPrompt({
      question: 'q',
      chunks: [],
      messages: [],
      summaryContext: 'User asked about physics earlier.',
    })
    expect(prompt).toContain('User asked about physics earlier.')
  })

  it('includes rule to NEVER put inline citations in the LLM response', () => {
    const prompt = buildPrompt({ question: 'q', chunks: sampleChunks, messages: [] })
    expect(prompt).toContain('NEVER include inline citations')
  })
})
