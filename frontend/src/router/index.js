import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth.js'

const routes = [
  { path: '/auth', component: () => import('../views/AuthView.vue'), meta: { public: true } },
  { path: '/', component: () => import('../views/AppView.vue'), meta: { requiresAuth: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isLoggedIn) return '/auth'
  if (to.meta.public && auth.isLoggedIn) return '/'
})

export default router
