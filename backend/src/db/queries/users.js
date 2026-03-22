import { eq } from 'drizzle-orm'
import { users } from '../schemas/users.js'

export function makeUserQueries(db) {
  return {
    findByEmail: (email) => db.select().from(users).where(eq(users.email, email)).limit(1),
    findById: (id) => db.select().from(users).where(eq(users.id, id)).limit(1),
    create: (data) => db.insert(users).values(data).returning(),
    update: (id, data) => db.update(users).set(data).where(eq(users.id, id)).returning(),
  }
}
