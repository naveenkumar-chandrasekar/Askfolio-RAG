import { upload, list, getOne, remove } from '../controllers/documents.js'

export default async function documentRoutes(fastify) {
  fastify.post('/api/documents/upload', { preHandler: [fastify.authenticate] }, upload.bind(fastify))
  fastify.get('/api/documents', { preHandler: [fastify.authenticate] }, list.bind(fastify))
  fastify.get('/api/documents/:id', { preHandler: [fastify.authenticate] }, getOne.bind(fastify))
  fastify.delete('/api/documents/:id', { preHandler: [fastify.authenticate] }, remove.bind(fastify))
}
