import { PrismaClient } from '@prisma/client'
import { getUserFromToken } from '../../../lib/auth'
import bcrypt from 'bcryptjs'

let prisma
if (!global.__prisma) {
  global.__prisma = new PrismaClient()
}
prisma = global.__prisma

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const auth = req.headers?.authorization || req.headers?.Authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing authorization token' })

  const user = await getUserFromToken(token)
  if (!user) return res.status(401).json({ error: 'Invalid or expired token' })

  const { name, password } = req.body || {}
  if (!name && !password) return res.status(400).json({ error: 'No updates provided' })

  const updates = {}
  if (name) {
    const n = String(name || '').trim()
    if (n.length < 2) return res.status(400).json({ error: 'Name must be at least 2 characters' })
    updates.name = n
  }
  if (password) {
    const p = String(password || '')
    if (p.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' })
    try {
      updates.password = await bcrypt.hash(p, 10)
    } catch (e) {
      return res.status(500).json({ error: 'Failed to hash password' })
    }
  }

  try {
    const updated = await prisma.user.update({ where: { id: user.id }, data: updates })
    return res.status(200).json({ ok: true, user: { id: updated.id, email: updated.email, name: updated.name, role: updated.role } })
  } catch (err) {
    console.error('Profile update error', err)
    return res.status(500).json({ error: 'Update failed' })
  }
}
