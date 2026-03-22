import { streamChat, getMessages } from '../controllers/chat.js'

export default async function chatRoutes(fastify) {
  fastify.post('/api/chat/:sessionId', { preHandler: [fastify.authenticate] }, streamChat.bind(fastify))
  fastify.get('/api/chat/:sessionId/messages', { preHandler: [fastify.authenticate] }, getMessages.bind(fastify))
}
