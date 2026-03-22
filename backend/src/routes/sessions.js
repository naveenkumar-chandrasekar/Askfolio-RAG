import { create, list, getOne, updateDocuments, remove } from '../controllers/sessions.js'

export default async function sessionRoutes(fastify) {
  fastify.post('/api/sessions', { preHandler: [fastify.authenticate] }, create.bind(fastify))
  fastify.get('/api/sessions', { preHandler: [fastify.authenticate] }, list.bind(fastify))
  fastify.get('/api/sessions/:id', { preHandler: [fastify.authenticate] }, getOne.bind(fastify))
  fastify.put('/api/sessions/:id/documents', { preHandler: [fastify.authenticate] }, updateDocuments.bind(fastify))
  fastify.delete('/api/sessions/:id', { preHandler: [fastify.authenticate] }, remove.bind(fastify))
}
