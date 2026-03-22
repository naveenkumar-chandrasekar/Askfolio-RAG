import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { api } from '../api/index.js'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token'))
  const userId = ref(localStorage.getItem('userId'))
  const name = ref(localStorage.getItem('userName') || '')
  const email = ref(localStorage.getItem('userEmail') || '')

  const isLoggedIn = computed(() => !!token.value)

  function _persist(res) {
    token.value = res.token
    userId.value = res.userId
    name.value = res.name || ''
    email.value = res.email || ''
    localStorage.setItem('token', res.token)
    localStorage.setItem('userId', res.userId)
    localStorage.setItem('userName', res.name || '')
    localStorage.setItem('userEmail', res.email || '')
  }

  async function login(emailVal, password) {
    const res = await api.auth.login(emailVal, password)
    _persist({ ...res, email: emailVal })
    await fetchMe()
  }

  async function register(emailVal, password, nameVal) {
    const res = await api.auth.register(emailVal, password, nameVal)
    _persist({ ...res, email: emailVal })
  }

  async function fetchMe() {
    const user = await api.users.me()
    name.value = user.name || ''
    email.value = user.email || ''
    localStorage.setItem('userName', user.name || '')
    localStorage.setItem('userEmail', user.email || '')
  }

  async function updateProfile(data) {
    const user = await api.users.update(data)
    name.value = user.name || ''
    email.value = user.email || ''
    localStorage.setItem('userName', user.name || '')
    localStorage.setItem('userEmail', user.email || '')
    return user
  }

  function logout() {
    token.value = null
    userId.value = null
    name.value = ''
    email.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('userId')
    localStorage.removeItem('userName')
    localStorage.removeItem('userEmail')
  }

  return { token, userId, name, email, isLoggedIn, login, register, fetchMe, updateProfile, logout }
})
