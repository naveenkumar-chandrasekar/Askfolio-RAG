import { defineStore } from 'pinia'
import { ref } from 'vue'

export const themes = {
  'Midnight': {
    '--bg': '#080c14', '--surface': '#0f1623', '--surface2': '#182030',
    '--border': '#1e2d44', '--accent': '#3b82f6', '--accent-hover': '#2563eb',
    '--text': '#e2eeff', '--text-muted': '#6b8ab0',
  },
  'Ocean': {
    '--bg': '#020b18', '--surface': '#061525', '--surface2': '#0a2035',
    '--border': '#0d2e50', '--accent': '#06b6d4', '--accent-hover': '#0891b2',
    '--text': '#dff6fa', '--text-muted': '#5a9aaa',
  },
  'Forest': {
    '--bg': '#0a0f0a', '--surface': '#111a11', '--surface2': '#182418',
    '--border': '#243524', '--accent': '#22c55e', '--accent-hover': '#16a34a',
    '--text': '#e4f5e8', '--text-muted': '#5a8c6a',
  },
  'Amethyst': {
    '--bg': '#0c0914', '--surface': '#130f20', '--surface2': '#1c1730',
    '--border': '#2a2248', '--accent': '#a78bfa', '--accent-hover': '#8b5cf6',
    '--text': '#edeaff', '--text-muted': '#7a6aaa',
  },
  'Rose': {
    '--bg': '#0f090c', '--surface': '#1a1018', '--surface2': '#241525',
    '--border': '#3a1e30', '--accent': '#f43f5e', '--accent-hover': '#e11d48',
    '--text': '#f8e8ee', '--text-muted': '#a06070',
  },
  'Ember': {
    '--bg': '#0f0a06', '--surface': '#1c1409', '--surface2': '#261c0e',
    '--border': '#3d2c10', '--accent': '#f59e0b', '--accent-hover': '#d97706',
    '--text': '#fdf3e0', '--text-muted': '#a08040',
  },
  'Cyberpunk': {
    '--bg': '#08080e', '--surface': '#10101a', '--surface2': '#18182a',
    '--border': '#28283e', '--accent': '#facc15', '--accent-hover': '#eab308',
    '--text': '#f4f4e8', '--text-muted': '#888860',
  },
  'Nord': {
    '--bg': '#1a1f2e', '--surface': '#222838', '--surface2': '#2c3448',
    '--border': '#3a4258', '--accent': '#88c0d0', '--accent-hover': '#5e9eb0',
    '--text': '#e5eaf0', '--text-muted': '#7a8898',
  },
  'Arctic': {
    '--bg': '#f0f4f8', '--surface': '#ffffff', '--surface2': '#e6edf5',
    '--border': '#c8d6e5', '--accent': '#0ea5e9', '--accent-hover': '#0284c7',
    '--text': '#0f172a', '--text-muted': '#526070',
  },
  'Obsidian': {
    '--bg': '#000000', '--surface': '#0c0c0c', '--surface2': '#161616',
    '--border': '#2a2a2a', '--accent': '#6366f1', '--accent-hover': '#4f46e5',
    '--text': '#f0f0f0', '--text-muted': '#707070',
  },
}

export const useThemeStore = defineStore('theme', () => {
  const saved = localStorage.getItem('theme') || 'Midnight'
  const current = ref(Object.keys(themes).includes(saved) ? saved : 'Midnight')

  function apply(name) {
    const vars = themes[name]
    if (!vars) return
    const root = document.documentElement
    for (const [k, v] of Object.entries(vars)) root.style.setProperty(k, v)
    current.value = name
    localStorage.setItem('theme', name)
  }

  apply(current.value)

  return { current, themes: Object.keys(themes), apply }
})
