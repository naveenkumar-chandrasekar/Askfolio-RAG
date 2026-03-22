<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal card">
      <h3>New Chat</h3>
      <form @submit.prevent="create">
        <div class="field">
          <label>Title</label>
          <input v-model="title" placeholder="e.g. Q4 Report Analysis" autofocus />
        </div>
        <div class="field" v-if="docs.documents.length > 0">
          <label>Link documents (optional)</label>
          <div class="doc-checkboxes">
            <label v-for="doc in docs.documents" :key="doc.id" class="doc-check" :class="{ disabled: doc.status !== 'ready' }">
              <input type="checkbox" :value="doc.id" v-model="selectedDocs" :disabled="doc.status !== 'ready'" />
              <span class="doc-label">{{ doc.fileName || doc.file_name || '(no name)' }}</span>
              <span v-if="doc.status !== 'ready'" class="badge-processing">{{ doc.status }}</span>
            </label>
          </div>
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <div class="modal-actions">
          <button type="button" class="btn-ghost" @click="$emit('close')">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="loading">
            <span v-if="loading" class="spinner"></span>
            <span v-else>Create</span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useChatStore } from '../stores/chat.js'
import { useDocumentsStore } from '../stores/documents.js'

const emit = defineEmits(['close', 'created'])
const chat = useChatStore()
const docs = useDocumentsStore()

const title = ref('')
const selectedDocs = ref([])
const loading = ref(false)
const error = ref('')

onMounted(() => docs.fetchDocuments())

async function create() {
  loading.value = true
  error.value = ''
  try {
    const session = await chat.createSession(title.value || 'New Chat', selectedDocs.value)
    await chat.selectSession(session.id)
    emit('created')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.modal {
  width: 400px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.modal h3 { font-size: 16px; font-weight: 600; }

form { display: flex; flex-direction: column; gap: 16px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field > label { font-size: 13px; color: var(--text-muted); }

.doc-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 160px;
  overflow-y: auto;
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px;
}

.doc-check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  cursor: pointer;
  color: var(--text);
  min-width: 0;
}
.doc-check input[type="checkbox"] {
  width: auto;
  flex-shrink: 0;
}
.doc-check.disabled { opacity: 0.45; cursor: not-allowed; }
.doc-label { flex: 1; min-width: 0; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.badge-processing { font-size: 10px; color: var(--text-muted); flex-shrink: 0; }

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.error { color: var(--danger); font-size: 13px; }
</style>
