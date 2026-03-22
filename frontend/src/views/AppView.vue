<template>
  <div class="app-layout">
    <Sidebar />
    <main class="main-area">
      <div class="topbar">
        <UserMenu />
      </div>
      <div class="content">
        <ChatArea v-if="chat.activeSession" />
        <EmptyState v-else />
      </div>
    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '../stores/chat.js'
import { useDocumentsStore } from '../stores/documents.js'
import { useAuthStore } from '../stores/auth.js'
import Sidebar from '../components/Sidebar.vue'
import ChatArea from '../components/ChatArea.vue'
import EmptyState from '../components/EmptyState.vue'
import UserMenu from '../components/UserMenu.vue'

const chat = useChatStore()
const docs = useDocumentsStore()
const auth = useAuthStore()
const router = useRouter()

onMounted(async () => {
  try {
    await auth.fetchMe()
  } catch {
    auth.logout()
    router.push('/auth')
    return
  }
  await Promise.all([chat.fetchSessions(), docs.fetchDocuments()])
})
</script>

<style scoped>
.app-layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.main-area {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.topbar {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  background: var(--surface);
}

.content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
