import 'dotenv/config'
import { buildApp } from './app.js'

const fastify = await buildApp({ logger: true })

try {
  await fastify.listen({ port: 3011, host: '0.0.0.0' })
} catch (err) {
  fastify.log.error(err)
  process.exit(1)
}
