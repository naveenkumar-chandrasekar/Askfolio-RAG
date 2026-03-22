import Fastify from 'fastify'
import fastifyCors from '@fastify/cors'
import fastifyMultipart from '@fastify/multipart'

import dbPlugin from './plugins/db.js'
import authPlugin from './plugins/auth.js'

import authRoutes from './routes/auth.js'
import userRoutes from './routes/users.js'
import documentRoutes from './routes/documents.js'
import sessionRoutes from './routes/sessions.js'
import chatRoutes from './routes/chat.js'

export async function buildApp(opts = {}) {
  const fastify = Fastify({ logger: opts.logger ?? false, ...opts.fastify })

  await fastify.register(fastifyCors, { origin: true })
  await fastify.register(fastifyMultipart, { limits: { fileSize: 50 * 1024 * 1024 } })

  if (opts.dbPlugin) {
    await fastify.register(opts.dbPlugin)
  } else {
    await fastify.register(dbPlugin)
  }

  await fastify.register(authPlugin)

  await fastify.register(authRoutes)
  await fastify.register(userRoutes)
  await fastify.register(documentRoutes)
  await fastify.register(sessionRoutes)
  await fastify.register(chatRoutes)

  fastify.get('/health', async () => ({ status: 'ok' }))

  return fastify
}
