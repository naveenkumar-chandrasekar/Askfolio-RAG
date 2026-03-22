import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api/index.js'

export const useChatStore = defineStore('chat', () => {
  const sessions = ref([])
  const activeSession = ref(null)
  const messages = ref([])
  const streaming = ref(false)
  const streamingText = ref('')

  async function fetchSessions() {
    sessions.value = await api.sessions.list()
  }

  async function createSession(title, documentIds = []) {
    const session = await api.sessions.create(title, documentIds)
    await fetchSessions()
    return session
  }

  async function selectSession(id) {
    activeSession.value = await api.sessions.get(id)
    messages.value = await api.chat.messages(id)
  }

  async function deleteSession(id) {
    await api.sessions.delete(id)
    sessions.value = sessions.value.filter(s => s.id !== id)
    if (activeSession.value?.id === id) {
      activeSession.value = null
      messages.value = []
    }
  }

  async function sendMessage(question) {
    if (!activeSession.value || streaming.value) return

    messages.value.push({ role: 'user', content: question, id: Date.now() })
    streaming.value = true
    streamingText.value = ''

    const assistantMsg = { role: 'assistant', content: '', sources: [], id: Date.now() + 1, streaming: true }
    messages.value.push(assistantMsg)
    const idx = messages.value.length - 1

    await api.chat.streamChat(
      activeSession.value.id,
      question,
      (token) => {
        streamingText.value += token
        messages.value[idx].content = streamingText.value
      },
      (sources) => { messages.value[idx] = { ...messages.value[idx], sources } },
      () => {
        messages.value[idx].streaming = false
        streaming.value = false
        streamingText.value = ''
      },
      (err) => {
        messages.value[idx].content = `Error: ${err.message}`
        messages.value[idx].streaming = false
        streaming.value = false
        streamingText.value = ''
      }
    )
  }

  async function addDocumentToSession(documentId) {
    if (!activeSession.value) return
    await api.sessions.updateDocuments(activeSession.value.id, [documentId], [])
    activeSession.value = await api.sessions.get(activeSession.value.id)
  }

  async function removeDocumentFromSession(documentId) {
    if (!activeSession.value) return
    await api.sessions.updateDocuments(activeSession.value.id, [], [documentId])
    activeSession.value = await api.sessions.get(activeSession.value.id)
  }

  return {
    sessions, activeSession, messages, streaming, streamingText,
    fetchSessions, createSession, selectSession, deleteSession,
    sendMessage, addDocumentToSession, removeDocumentFromSession,
  }
})
