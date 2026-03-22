import bcrypt from 'bcrypt'

export async function register(request, reply) {
  const { email, password, name = '' } = request.body
  if (!email || !password) return reply.code(400).send({ error: 'email and password required' })

  const existing = await this.queries.users.findByEmail(email)
  if (existing.length > 0) return reply.code(409).send({ error: 'Email already registered' })

  const passwordHash = await bcrypt.hash(password, 10)
  const [user] = await this.queries.users.create({ email, name, passwordHash })

  const token = this.jwt.sign({ userId: user.id, email: user.email })
  return reply.code(201).send({ token, userId: user.id, name: user.name })
}

export async function login(request, reply) {
  const { email, password } = request.body
  if (!email || !password) return reply.code(400).send({ error: 'email and password required' })

  const users = await this.queries.users.findByEmail(email)
  if (users.length === 0) return reply.code(401).send({ error: 'Invalid credentials' })

  const user = users[0]
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) return reply.code(401).send({ error: 'Invalid credentials' })

  const token = this.jwt.sign({ userId: user.id, email: user.email })
  return { token, userId: user.id, name: user.name }
}
