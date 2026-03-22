import { config } from '../config.js'
import Anthropic from '@anthropic-ai/sdk'

let anthropicClient = null

function getAnthropic() {
  if (!anthropicClient) anthropicClient = new Anthropic({ apiKey: config.anthropicApiKey })
  return anthropicClient
}

export async function* streamResponse(prompt) {
  if (config.isProduction) {
    yield* streamWithClaude(prompt)
  } else {
    yield* streamWithOllama(prompt)
  }
}

async function* streamWithClaude(prompt) {
  const anthropic = getAnthropic()
  const stream = anthropic.messages.stream({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      yield event.delta.text
    }
  }
}

async function* streamWithOllama(prompt) {
  const res = await fetch(`${config.ollama.baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: config.ollama.llmModel, prompt, stream: true }),
  })

  if (!res.ok) throw new Error(`Ollama LLM error: ${res.statusText}`)

  const reader = res.body.getReader()
  const decoder = new TextDecoder()

  while (true) {
    const { done, value } = await reader.read()
    if (done) break
    const lines = decoder.decode(value).split('\n').filter(Boolean)
    for (const line of lines) {
      try {
        const data = JSON.parse(line)
        if (data.response) yield data.response
      } catch {}
    }
  }
}

export async function generateSummary(transcript) {
  if (config.isProduction) {
    const anthropic = getAnthropic()
    const msg = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Summarize this conversation concisely, preserving key facts, decisions, and context:\n\n${transcript}`,
      }],
    })
    return msg.content[0].text
  }

  const res = await fetch(`${config.ollama.baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ollama.llmModel,
      prompt: `Summarize this conversation concisely, preserving key facts, decisions, and context:\n\n${transcript}`,
      stream: false,
    }),
  })
  const data = await res.json()
  return data.response
}
