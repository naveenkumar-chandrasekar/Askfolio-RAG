import 'dotenv/config'
import pkg from 'pg'
import { readFile } from 'fs/promises'

const { Client } = pkg

const client = new Client({ connectionString: process.env.DATABASE_URL })
await client.connect()

const sql = await readFile('./drizzle/0000_init.sql', 'utf-8')
await client.query(sql)

console.log('Database schema created successfully.')
await client.end()
