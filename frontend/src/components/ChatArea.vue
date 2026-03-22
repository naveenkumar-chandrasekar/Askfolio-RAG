<template>
  <div class="chat-area">
    <div class="chat-header">
      <div class="header-info">
        <h2>{{ chat.activeSession.title }}</h2>
        <div class="linked-docs" v-if="linkedDocs.length">
          <span v-for="doc in linkedDocs" :key="doc.id" class="doc-pill">{{ doc.fileName }}</span>
        </div>
        <span v-else class="no-docs">No documents linked — link docs in sidebar</span>
      </div>
    </div>

    <div class="messages" ref="messagesEl">
      <div v-if="chat.messages.length === 0" class="no-messages">
        Ask a question about your linked documents
      </div>

      <div
        v-for="msg in chat.messages"
        :key="msg.id"
        :class="['message', msg.role]"
      >
        <div class="bubble" :class="{ 'has-sources': msg.role === 'assistant' && msg.sources?.length }">
          <div v-if="msg.streaming && !msg.content" class="thinking">
            <span class="thinking-label">Thinking</span>
            <div class="thinking-dots">
              <span></span><span></span><span></span>
            </div>
          </div>
          <template v-else>
            <div class="msg-content" v-html="renderContent(msg.content)"></div>
            <div v-if="msg.streaming" class="cursor"></div>
          </template>
          <div v-if="msg.role === 'assistant' && msg.sources?.length" class="sources-footer">
            <button class="sources-btn" @click="toggleSources(msg.id)">
              {{ openSources.has(msg.id) ? '▾' : '▸' }} {{ msg.sources.length }} source{{ msg.sources.length > 1 ? 's' : '' }}
            </button>
            <button class="copy-btn" @click="copySources(msg)" title="Copy sources">⎘</button>
          </div>
          <div v-if="openSources.has(msg.id)" class="sources-panel">
            <div v-for="(src, i) in msg.sources" :key="i" class="source-item">
              <span class="source-file">{{ src.fileName }}</span>
              <span class="source-page">p.{{ src.pageNumber ?? '?' }}</span>
              <span class="source-preview">{{ src.preview }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="input-area">
      <textarea
        v-model="question"
        placeholder="Ask a question about your documents..."
        rows="1"
        @keydown.enter.exact.prevent="send"
        @keydown.enter.shift.exact="question += '\n'"
        @input="autoResize"
        ref="textareaEl"
        :disabled="chat.streaming"
      ></textarea>
      <button class="btn-primary send-btn" @click="send" :disabled="!question.trim() || chat.streaming">
        <span v-if="chat.streaming" class="spinner"></span>
        <span v-else>↑</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useChatStore } from '../stores/chat.js'

const chat = useChatStore()
const question = ref('')
const messagesEl = ref(null)
const textareaEl = ref(null)
const openSources = ref(new Set())

const linkedDocs = computed(() => chat.activeSession?.documents || [])

function renderContent(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\n/g, '<br>')
}

function toggleSources(id) {
  const s = new Set(openSources.value)
  s.has(id) ? s.delete(id) : s.add(id)
  openSources.value = s
}

function copySources(msg) {
  const text = msg.sources.map((s, i) =>
    `[${i + 1}] ${s.fileName} p.${s.pageNumber ?? '?'}\n${s.preview}`
  ).join('\n\n')
  navigator.clipboard.writeText(text)
}

function autoResize(e) {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 160) + 'px'
}

async function send() {
  const q = question.value.trim()
  if (!q || chat.streaming) return
  question.value = ''
  await nextTick()
  if (textareaEl.value) textareaEl.value.style.height = 'auto'
  await chat.sendMessage(q)
}

watch(() => chat.messages.length, async () => {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
})

watch(() => chat.streamingText, async () => {
  await nextTick()
  if (messagesEl.value) messagesEl.value.scrollTop = messagesEl.value.scrollHeight
})
</script>

<style scoped>
.chat-area {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.chat-header {
  padding: 14px 24px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.header-info h2 { font-size: 16px; font-weight: 600; }

.linked-docs {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 6px;
}

.doc-pill {
  background: rgba(108,99,255,0.15);
  color: var(--accent);
  border-radius: 99px;
  padding: 2px 10px;
  font-size: 11px;
}

.no-docs {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: 4px;
  display: block;
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.no-messages {
  text-align: center;
  color: var(--text-muted);
  margin-top: 80px;
  font-size: 15px;
}

.message { display: flex; }
.message.user { justify-content: flex-end; }
.message.assistant { justify-content: flex-start; }

.bubble {
  max-width: 72%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.message.user .bubble {
  background: var(--accent);
  color: #fff;
  border-radius: 16px 16px 4px 16px;
  padding: 12px 16px;
}

.message.assistant .bubble {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px 16px 16px 4px;
  padding: 12px 16px;
}

.msg-content {
  line-height: 1.7;
  font-size: 14px;
  white-space: pre-wrap;
  word-break: break-word;
}

.msg-content :deep(code) {
  background: var(--surface2);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 13px;
  font-family: monospace;
}

.cursor {
  display: inline-block;
  width: 2px;
  height: 16px;
  background: var(--accent);
  animation: blink 0.8s step-end infinite;
  vertical-align: middle;
  margin-left: 2px;
}
@keyframes blink { 50% { opacity: 0; } }

.thinking {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 4px 0;
}

.thinking-label {
  font-size: 12px;
  color: var(--text-muted);
  letter-spacing: 0.05em;
  animation: pulse-text 1.8s ease-in-out infinite;
}

@keyframes pulse-text {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 1; }
}

.thinking-dots {
  display: flex;
  align-items: center;
  gap: 5px;
}

.thinking-dots span {
  display: block;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent);
  animation: dot-bounce 1.4s ease-in-out infinite;
  box-shadow: 0 0 6px var(--accent);
}

.thinking-dots span:nth-child(1) { animation-delay: 0s; }
.thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
.thinking-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dot-bounce {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
    box-shadow: 0 0 4px var(--accent);
  }
  30% {
    transform: translateY(-8px);
    opacity: 1;
    box-shadow: 0 0 12px var(--accent), 0 0 24px var(--accent);
  }
}

.sources-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.sources-btn {
  font-size: 11px;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 2px 8px;
  cursor: pointer;
  font-family: var(--font);
}
.sources-btn:hover { color: var(--text); background: var(--surface2); }

.copy-btn {
  font-size: 13px;
  color: var(--text-muted);
  background: transparent;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 2px 6px;
  cursor: pointer;
}
.copy-btn:hover { color: var(--accent); background: var(--surface2); }

.sources-panel {
  border-top: 1px solid var(--border);
  padding-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.source-item {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 6px;
  font-size: 12px;
}

.source-file { font-weight: 600; color: var(--accent); }
.source-page { color: var(--text-muted); }
.source-preview {
  color: var(--text-muted);
  font-size: 11px;
  flex-basis: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.input-area {
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

textarea {
  flex: 1;
  resize: none;
  line-height: 1.5;
  max-height: 160px;
  overflow-y: auto;
}

.send-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 18px;
  padding: 0;
}
</style>
