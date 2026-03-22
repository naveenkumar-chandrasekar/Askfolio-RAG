<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <span class="brand">📄 Askfolio</span>
      <div class="header-actions">
        <div class="theme-picker" ref="themePickerEl">
          <button class="theme-btn" @click="showThemes = !showThemes" title="Change theme">
            <span class="theme-dot" :style="{ background: accentColor }"></span>
          </button>
          <div v-if="showThemes" class="theme-dropdown">
            <button
              v-for="t in themeStore.themes"
              :key="t"
              class="theme-option"
              :class="{ active: t === themeStore.current }"
              @click="selectTheme(t)"
            >
              <span class="theme-swatch" :style="{ background: themeAccent(t) }"></span>
              <span>{{ t }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="sidebar-section">
      <div class="section-title">
        <span>Chats</span>
        <button class="btn-ghost icon-btn" title="New chat" @click="showNewSession = true">＋</button>
      </div>
      <div class="session-list">
        <div
          v-for="s in chat.sessions"
          :key="s.id"
          :class="['session-item', chat.activeSession?.id === s.id && 'active']"
          @click="selectSession(s.id)"
        >
          <span class="session-title">{{ s.title }}</span>
          <button class="btn-danger icon-btn del-btn" @click.stop="deleteSession(s.id)">✕</button>
        </div>
        <div v-if="chat.sessions.length === 0" class="empty-list">No chats yet</div>
      </div>
    </div>

    <div class="sidebar-section">
      <div class="section-title">
        <span>Documents</span>
        <label class="btn-ghost icon-btn" title="Upload document">
          ＋
          <input type="file" @change="handleUpload" style="display:none" multiple accept=".pdf,.docx,.pptx,.xlsx,.csv,.txt,.md,.png,.jpg,.jpeg" />
        </label>
      </div>
      <div class="allowed-formats">
        <span v-for="fmt in ['PDF','DOCX','PPTX','XLSX','CSV','TXT','MD','PNG','JPG']" :key="fmt" class="fmt-pill">{{ fmt }}</span>
      </div>
      <div v-if="uploadError" class="upload-error">
        <span>{{ uploadError }}</span>
        <button class="clear-error" @click="uploadError = null">✕</button>
      </div>
      <div class="doc-list">
        <div v-for="doc in docs.documents" :key="doc.id" class="doc-item">
          <div class="doc-info">
            <span class="doc-name">{{ doc.fileName }}</span>
            <span :class="['badge', `badge-${doc.status}`]">{{ doc.status }}</span>
          </div>
          <div class="doc-actions">
            <button
              v-if="chat.activeSession && doc.status === 'ready'"
              class="btn-ghost icon-btn"
              :title="isLinked(doc.id) ? 'Unlink from chat' : 'Link to chat'"
              @click="toggleLink(doc.id)"
            >
              {{ isLinked(doc.id) ? '🔗' : '○' }}
            </button>
            <button class="btn-danger icon-btn" @click="deleteDoc(doc.id)">✕</button>
          </div>
        </div>
        <div v-if="docs.documents.length === 0" class="empty-list">No documents yet</div>
      </div>
    </div>

    <NewSessionModal v-if="showNewSession" @close="showNewSession = false" @created="showNewSession = false" />
  </aside>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useChatStore } from '../stores/chat.js'
import { useDocumentsStore } from '../stores/documents.js'
import { useThemeStore } from '../stores/theme.js'
import { themes } from '../stores/theme.js'
import NewSessionModal from './NewSessionModal.vue'

const chat = useChatStore()
const docs = useDocumentsStore()
const themeStore = useThemeStore()
const showNewSession = ref(false)
const showThemes = ref(false)
const themePickerEl = ref(null)
const uploadError = ref(null)

const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.pptx', '.xlsx', '.csv', '.txt', '.md', '.png', '.jpg', '.jpeg'])

function getExt(name) {
  return name.slice(name.lastIndexOf('.')).toLowerCase()
}

const accentColor = computed(() => themes[themeStore.current]?.['--accent'] || '#6366f1')

function themeAccent(name) {
  return themes[name]?.['--accent'] || '#888'
}

function selectTheme(name) {
  themeStore.apply(name)
  showThemes.value = false
}

function onClickOutside(e) {
  if (themePickerEl.value && !themePickerEl.value.contains(e.target)) {
    showThemes.value = false
  }
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))

const linkedDocIds = computed(() =>
  new Set((chat.activeSession?.documents || []).map(d => d.id))
)

function isLinked(docId) {
  return linkedDocIds.value.has(docId)
}

async function selectSession(id) {
  await chat.selectSession(id)
}

async function deleteSession(id) {
  try {
    await chat.deleteSession(id)
  } catch (e) {
    alert(`Failed to delete chat: ${e.message}`)
  }
}

async function handleUpload(e) {
  uploadError.value = null
  const files = Array.from(e.target.files)

  const invalid = files.filter(f => !ALLOWED_EXTENSIONS.has(getExt(f.name)))
  if (invalid.length > 0) {
    const names = invalid.map(f => f.name).join(', ')
    uploadError.value = `Unsupported format: ${names}. Allowed: PDF, DOCX, PPTX, XLSX, CSV, TXT, MD, PNG, JPG`
    e.target.value = ''
    return
  }

  for (const file of files) {
    try {
      const result = await docs.uploadDocument(file)
      if (result?.id) {
        docs.pollDocument(result.id, () => {})
      }
    } catch (err) {
      uploadError.value = `Upload failed: ${err.message}`
    }
  }
  e.target.value = ''
}

async function deleteDoc(id) {
  try {
    await docs.deleteDocument(id)
  } catch (e) {
    alert(`Failed to delete document: ${e.message}`)
  }
}

async function toggleLink(docId) {
  if (isLinked(docId)) {
    await chat.removeDocumentFromSession(docId)
  } else {
    await chat.addDocumentToSession(docId)
  }
}

</script>

<style scoped>
.sidebar {
  width: 260px;
  background: var(--surface);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  gap: 8px;
}
.brand { font-weight: 700; font-size: 15px; flex-shrink: 0; }
.header-actions { display: flex; align-items: center; gap: 4px; }

.theme-picker { position: relative; }

.theme-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: var(--surface2);
  cursor: pointer;
  padding: 0;
}
.theme-btn:hover { background: var(--surface); border-color: var(--accent); }

.theme-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: block;
}

.theme-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 2px;
  z-index: 100;
  min-width: 160px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 6px;
  border: none;
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  font-family: var(--font);
  cursor: pointer;
  text-align: left;
  width: 100%;
}
.theme-option:hover { background: var(--surface2); color: var(--text); }
.theme-option.active { color: var(--accent); background: var(--surface2); }

.theme-swatch {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  flex-shrink: 0;
}

.sidebar-section {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  padding: 12px 0;
}

.section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 8px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
}

.allowed-formats {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 0 16px 8px;
}

.fmt-pill {
  font-size: 9px;
  font-weight: 600;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 2px 5px;
  opacity: 0.7;
}

.upload-error {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  margin: 0 8px 6px;
  padding: 8px 10px;
  background: rgba(220, 38, 38, 0.12);
  border: 1px solid rgba(220, 38, 38, 0.3);
  border-radius: 8px;
  font-size: 11px;
  color: #f87171;
  line-height: 1.4;
}

.upload-error span { flex: 1; }

.clear-error {
  background: none;
  border: none;
  color: #f87171;
  cursor: pointer;
  font-size: 10px;
  padding: 0;
  flex-shrink: 0;
  opacity: 0.7;
}
.clear-error:hover { opacity: 1; }

.session-list, .doc-list {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.session-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.1s;
}
.session-item:hover { background: var(--surface2); }
.session-item.active { background: rgba(108,99,255,0.15); }

.session-title {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
}

.del-btn { opacity: 0; font-size: 11px; }
.session-item:hover .del-btn { opacity: 1; }

.doc-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px;
  border-radius: 8px;
  gap: 8px;
}
.doc-item:hover { background: var(--surface2); }

.doc-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.doc-name {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.doc-actions {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.icon-btn {
  padding: 4px 6px;
  font-size: 13px;
  border-radius: 6px;
}

.empty-list {
  font-size: 12px;
  color: var(--text-muted);
  padding: 8px 10px;
  text-align: center;
}
</style>
