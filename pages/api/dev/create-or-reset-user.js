import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Dev-only helper to create or update a user and set a known password for recovery/testing.
let prisma
if (!global.__prisma) global.__prisma = new PrismaClient()
prisma = global.__prisma

export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Not allowed in production' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { email, name, password, role } = req.body || {}
  if (!email) return res.status(400).json({ error: 'Missing email' })

  const emailNorm = String(email).trim().toLowerCase()
  const nameNorm = name ? String(name).trim() : (emailNorm.split('@')[0] || 'Dev User')
  const passwordStr = password ? String(password) : 'password123'
  const roleNorm = role ? String(role) : 'TEAM_MEMBER'

  try {
    const hashed = await bcrypt.hash(passwordStr, 10)
    const data = { name: nameNorm, email: emailNorm, password: hashed, role: roleNorm }

    const user = await prisma.user.upsert({ where: { email: emailNorm }, update: data, create: data })

    return res.status(200).json({ ok: true, id: user.id, email: user.email, message: `User created/updated (dev only).` })
  } catch (err) {
    console.error('dev create-or-reset-user error', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
