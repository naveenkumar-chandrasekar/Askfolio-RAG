import bcrypt from 'bcrypt'

export async function getMe(request, reply) {
  const rows = await this.queries.users.findById(request.user.userId)
  if (rows.length === 0) return reply.code(404).send({ error: 'User not found' })
  const { passwordHash: _pw, ...user } = rows[0]
  return user
}

export async function updateMe(request, reply) {
  const userId = request.user.userId
  const { name, email, currentPassword, newPassword } = request.body || {}

  const rows = await this.queries.users.findById(userId)
  if (rows.length === 0) return reply.code(404).send({ error: 'User not found' })
  const user = rows[0]

  const updates = {}

  if (name !== undefined) updates.name = name
  if (email !== undefined && email !== user.email) {
    const existing = await this.queries.users.findByEmail(email)
    if (existing.length > 0) return reply.code(409).send({ error: 'Email already in use' })
    updates.email = email
  }

  if (newPassword) {
    if (!currentPassword) return reply.code(400).send({ error: 'currentPassword required to set new password' })
    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) return reply.code(401).send({ error: 'Current password is incorrect' })
    updates.passwordHash = await bcrypt.hash(newPassword, 10)
  }

  if (Object.keys(updates).length === 0) return reply.code(400).send({ error: 'Nothing to update' })

  const [updated] = await this.queries.users.update(userId, updates)
  const { passwordHash: _pw2, ...result } = updated
  return result
}
