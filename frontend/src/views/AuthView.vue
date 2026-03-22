<template>
  <div class="auth-page">
    <div class="auth-card card">
      <div class="logo">
        <span class="logo-icon">📄</span>
        <h1>Askfolio</h1>
        <p>Ask questions about your documents</p>
      </div>

      <div class="tabs">
        <button :class="['tab', mode === 'login' && 'active']" @click="mode = 'login'">Sign In</button>
        <button :class="['tab', mode === 'register' && 'active']" @click="mode = 'register'">Register</button>
      </div>

      <form @submit.prevent="submit">
        <div v-if="mode === 'register'" class="field">
          <label>Name</label>
          <input v-model="name" type="text" placeholder="Your name" required />
        </div>
        <div class="field">
          <label>Email</label>
          <input v-model="email" type="email" placeholder="you@example.com" required />
        </div>
        <div class="field">
          <label>Password</label>
          <input v-model="password" type="password" placeholder="••••••••" required />
        </div>
        <p v-if="error" class="error">{{ error }}</p>
        <button type="submit" class="btn-primary submit-btn" :disabled="loading">
          <span v-if="loading" class="spinner"></span>
          <span v-else>{{ mode === 'login' ? 'Sign In' : 'Create Account' }}</span>
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const auth = useAuthStore()
const router = useRouter()

const mode = ref('login')
const name = ref('')
const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    if (mode.value === 'login') {
      await auth.login(email.value, password.value)
    } else {
      await auth.register(email.value, password.value, name.value)
    }
    router.push('/')
  } catch (e) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.auth-page {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg);
}

.auth-card {
  width: 380px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.logo {
  text-align: center;
}
.logo-icon { font-size: 32px; }
.logo h1 { font-size: 22px; font-weight: 700; margin-top: 6px; }
.logo p { color: var(--text-muted); font-size: 13px; margin-top: 4px; }

.tabs {
  display: flex;
  background: var(--surface2);
  border-radius: var(--radius);
  padding: 3px;
  gap: 3px;
}
.tab {
  flex: 1;
  padding: 7px;
  border-radius: 8px;
  background: transparent;
  color: var(--text-muted);
  font-size: 13px;
}
.tab.active {
  background: var(--accent);
  color: #fff;
}

form { display: flex; flex-direction: column; gap: 14px; }

.field { display: flex; flex-direction: column; gap: 6px; }
.field label { font-size: 13px; color: var(--text-muted); }

.error {
  color: var(--danger);
  font-size: 13px;
  text-align: center;
}

.submit-btn {
  width: 100%;
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 4px;
}
</style>
