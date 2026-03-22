<template>
  <div class="modal-backdrop" @click.self="$emit('close')">
    <div class="modal card">
      <div class="modal-header">
        <h2>Profile</h2>
        <button class="btn-ghost icon-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="avatar-row">
        <div class="avatar">{{ initials }}</div>
        <div>
          <div class="avatar-name">{{ auth.name || 'No name set' }}</div>
          <div class="avatar-email">{{ auth.email }}</div>
        </div>
      </div>

      <form @submit.prevent="saveProfile" class="section">
        <h3>Account Details</h3>
        <div class="field">
          <label>Name</label>
          <input v-model="form.name" type="text" placeholder="Your name" />
        </div>
        <div class="field">
          <label>Email</label>
          <input v-model="form.email" type="email" placeholder="you@example.com" />
        </div>
        <p v-if="profileMsg" :class="['msg', profileErr ? 'msg-err' : 'msg-ok']">{{ profileMsg }}</p>
        <button type="submit" class="btn-primary save-btn" :disabled="profileLoading">
          <span v-if="profileLoading" class="spinner"></span>
          <span v-else>Save Changes</span>
        </button>
      </form>

      <form @submit.prevent="savePassword" class="section">
        <h3>Change Password</h3>
        <div class="field">
          <label>Current Password</label>
          <input v-model="pwd.current" type="password" placeholder="••••••••" />
        </div>
        <div class="field">
          <label>New Password</label>
          <input v-model="pwd.next" type="password" placeholder="••••••••" />
        </div>
        <div class="field">
          <label>Confirm New Password</label>
          <input v-model="pwd.confirm" type="password" placeholder="••••••••" />
        </div>
        <p v-if="pwdMsg" :class="['msg', pwdErr ? 'msg-err' : 'msg-ok']">{{ pwdMsg }}</p>
        <button type="submit" class="btn-primary save-btn" :disabled="pwdLoading">
          <span v-if="pwdLoading" class="spinner"></span>
          <span v-else>Update Password</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '../stores/auth.js'

defineEmits(['close'])

const auth = useAuthStore()

const form = ref({ name: auth.name, email: auth.email })
const profileMsg = ref('')
const profileErr = ref(false)
const profileLoading = ref(false)

const pwd = ref({ current: '', next: '', confirm: '' })
const pwdMsg = ref('')
const pwdErr = ref(false)
const pwdLoading = ref(false)

const initials = computed(() => {
  const n = auth.name || auth.email || '?'
  return n.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
})

async function saveProfile() {
  profileMsg.value = ''
  profileLoading.value = true
  try {
    await auth.updateProfile({ name: form.value.name, email: form.value.email })
    profileMsg.value = 'Saved successfully'
    profileErr.value = false
  } catch (e) {
    profileMsg.value = e.message
    profileErr.value = true
  } finally {
    profileLoading.value = false
  }
}

async function savePassword() {
  pwdMsg.value = ''
  if (pwd.value.next !== pwd.value.confirm) {
    pwdMsg.value = 'Passwords do not match'
    pwdErr.value = true
    return
  }
  if (pwd.value.next.length < 6) {
    pwdMsg.value = 'Password must be at least 6 characters'
    pwdErr.value = true
    return
  }
  pwdLoading.value = true
  try {
    await auth.updateProfile({ currentPassword: pwd.value.current, newPassword: pwd.value.next })
    pwdMsg.value = 'Password updated'
    pwdErr.value = false
    pwd.value = { current: '', next: '', confirm: '' }
  } catch (e) {
    pwdMsg.value = e.message
    pwdErr.value = true
  } finally {
    pwdLoading.value = false
  }
}
</script>

<style scoped>
.modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.modal {
  width: 420px;
  max-height: 90vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.modal-header h2 { font-size: 16px; font-weight: 600; }

.avatar-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--accent);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-name { font-size: 14px; font-weight: 600; }
.avatar-email { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

.section { display: flex; flex-direction: column; gap: 14px; }
.section h3 { font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.06em; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 13px; color: var(--text-muted); }

.save-btn {
  align-self: flex-start;
  padding: 8px 20px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.msg { font-size: 13px; }
.msg-ok { color: var(--accent); }
.msg-err { color: var(--danger, #f87171); }
</style>
