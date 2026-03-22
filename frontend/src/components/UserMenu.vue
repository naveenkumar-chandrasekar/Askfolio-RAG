<template>
  <div class="user-menu" ref="menuEl">
    <button class="user-btn" @click="open = !open">
      <div class="user-avatar">{{ initials }}</div>
      <span class="user-name">{{ auth.name || auth.email }}</span>
      <span class="chevron">{{ open ? '▴' : '▾' }}</span>
    </button>

    <div v-if="open" class="dropdown">
      <div class="dropdown-header">
        <div class="dh-avatar">{{ initials }}</div>
        <div>
          <div class="dh-name">{{ auth.name || '—' }}</div>
          <div class="dh-email">{{ auth.email }}</div>
        </div>
      </div>
      <div class="divider"></div>
      <button class="dropdown-item" @click="openProfile">
        <span>👤</span> Profile
      </button>
      <button class="dropdown-item danger" @click="logout">
        <span>⎋</span> Logout
      </button>
    </div>

    <ProfileModal v-if="showProfile" @close="showProfile = false" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'
import ProfileModal from './ProfileModal.vue'

const auth = useAuthStore()
const router = useRouter()
const open = ref(false)
const showProfile = ref(false)
const menuEl = ref(null)

const initials = computed(() => {
  const n = auth.name || auth.email || '?'
  return n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
})

function openProfile() {
  open.value = false
  showProfile.value = true
}

function logout() {
  auth.logout()
  router.push('/auth')
}

function onClickOutside(e) {
  if (menuEl.value && !menuEl.value.contains(e.target)) open.value = false
}

onMounted(() => document.addEventListener('mousedown', onClickOutside))
onUnmounted(() => document.removeEventListener('mousedown', onClickOutside))
</script>

<style scoped>
.user-menu {
  position: relative;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px 5px 5px;
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  cursor: pointer;
  color: var(--text);
  font-family: var(--font);
}
.user-btn:hover { background: var(--surface2); }

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 11px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.user-name {
  font-size: 13px;
  max-width: 120px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chevron { font-size: 10px; color: var(--text-muted); }

.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  min-width: 220px;
  z-index: 100;
  box-shadow: 0 8px 24px rgba(0,0,0,0.4);
  overflow: hidden;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
}

.dh-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 13px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.dh-name { font-size: 13px; font-weight: 600; }
.dh-email { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

.divider { height: 1px; background: var(--border); }

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 14px;
  background: transparent;
  border: none;
  color: var(--text-muted);
  font-size: 13px;
  font-family: var(--font);
  cursor: pointer;
  text-align: left;
}
.dropdown-item:hover { background: var(--surface2); color: var(--text); }
.dropdown-item.danger:hover { color: var(--danger, #f87171); }
</style>
