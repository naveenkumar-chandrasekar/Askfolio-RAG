import fp from 'fastify-plugin'
import { drizzle } from 'drizzle-orm/node-postgres'
import pkg from 'pg'
import { config } from '../config.js'
import * as schema from '../db/schemas/index.js'
import { makeQueries } from '../db/queries/index.js'

const { Pool } = pkg

async function dbPlugin(fastify) {
  const pool = new Pool({ connectionString: config.databaseUrl })

  await pool.connect()

  const db = drizzle(pool, { schema })
  const queries = makeQueries(db)

  fastify.decorate('db', db)
  fastify.decorate('queries', queries)

  fastify.addHook('onClose', async () => {
    await pool.end()
  })
}

export default fp(dbPlugin)
