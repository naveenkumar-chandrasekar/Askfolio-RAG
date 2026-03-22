import { register, login } from '../controllers/auth.js'

export default async function authRoutes(fastify) {
  fastify.post('/api/auth/register', register.bind(fastify))
  fastify.post('/api/auth/login', login.bind(fastify))
}
