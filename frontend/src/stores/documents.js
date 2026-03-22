import { defineStore } from 'pinia'
import { ref } from 'vue'
import { api } from '../api/index.js'

export const useDocumentsStore = defineStore('documents', () => {
  const documents = ref([])
  const loading = ref(false)

  async function fetchDocuments() {
    loading.value = true
    try {
      documents.value = await api.documents.list()
    } finally {
      loading.value = false
    }
  }

  async function uploadDocument(file) {
    const result = await api.documents.upload(file)
    await fetchDocuments()
    return result
  }

  async function deleteDocument(id) {
    await api.documents.delete(id)
    documents.value = documents.value.filter(d => d.id !== id)
  }

  function pollDocument(id, callback) {
    const interval = setInterval(async () => {
      const doc = await api.documents.get(id)
      const idx = documents.value.findIndex(d => d.id === id)
      if (idx !== -1) documents.value[idx] = doc
      if (doc.status !== 'processing') {
        clearInterval(interval)
        callback(doc)
      }
    }, 2000)
    return () => clearInterval(interval)
  }

  return { documents, loading, fetchDocuments, uploadDocument, deleteDocument, pollDocument }
})
