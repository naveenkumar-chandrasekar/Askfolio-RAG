import fp from 'fastify-plugin'
import fastifyJwt from '@fastify/jwt'
import { config } from '../config.js'

async function authPlugin(fastify) {
  fastify.register(fastifyJwt, { secret: config.jwtSecret })

  fastify.decorate('authenticate', async (request, reply) => {
    try {
      await request.jwtVerify()
    } catch {
      reply.code(401).send({ error: 'Unauthorized' })
    }
  })
}

export default fp(authPlugin)
