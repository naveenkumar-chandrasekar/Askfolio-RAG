import { config } from '../config.js'
import OpenAI from 'openai'

let openaiClient = null

function getOpenAI() {
  if (!openaiClient) openaiClient = new OpenAI({ apiKey: config.openaiApiKey })
  return openaiClient
}

async function embedWithOllama(texts) {
  const results = []
  for (const text of texts) {
    const res = await fetch(`${config.ollama.baseUrl}/api/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: config.ollama.embedModel, prompt: text }),
    })
    if (!res.ok) throw new Error(`Ollama embed error: ${res.statusText}`)
    const data = await res.json()
    results.push(data.embedding)
  }
  return results
}

async function embedWithOpenAI(texts) {
  const openai = getOpenAI()
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  })
  return res.data.map(d => d.embedding)
}

export async function embedBatch(texts) {
  if (config.isProduction) return embedWithOpenAI(texts)
  return embedWithOllama(texts)
}

export async function embedOne(text) {
  const results = await embedBatch([text])
  return results[0]
}
