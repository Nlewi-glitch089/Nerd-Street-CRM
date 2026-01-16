import { getPrisma } from '../../../lib/prisma'
import bcrypt from 'bcryptjs'

// Dev-only endpoint to reset a user's password.
// Usage: POST /api/dev/reset-password with JSON { "email": "rob@example.com", "password": "chocolate" }
// Disabled in production.
export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Forbidden in production' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { email, password } = req.body || {}
  if (!email) return res.status(400).json({ error: 'Missing email' })
  const newPass = password || 'password123'
  try {
    const prisma = getPrisma()
    let user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } })
    if (!user) {
      // attempt case-insensitive lookup
      user = await prisma.user.findFirst({ where: { email: { equals: String(email).trim().toLowerCase(), mode: 'insensitive' } } }).catch(() => null)
      if (!user) return res.status(404).json({ error: 'User not found' })
    }
    const hashed = await bcrypt.hash(newPass, 10)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
    return res.status(200).json({ ok: true, message: `Password for ${user.email} reset to '${newPass}' (dev only)` })
  } catch (err) {
    console.error('dev reset-password error', err)
    return res.status(500).json({ error: err.message || String(err) })
  }
}
