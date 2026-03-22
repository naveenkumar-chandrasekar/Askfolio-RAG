import { getMe, updateMe } from '../controllers/users.js'

export default async function userRoutes(fastify) {
  fastify.get('/api/users/me', { preHandler: [fastify.authenticate] }, getMe.bind(fastify))
  fastify.put('/api/users/me', { preHandler: [fastify.authenticate] }, updateMe.bind(fastify))
}
