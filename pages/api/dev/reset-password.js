import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// Dev-only helper to reset a user's password to a known value for recovery/testing.
let prisma
if (!global.__prisma) global.__prisma = new PrismaClient()
prisma = global.__prisma

export default async function handler(req, res) {
  if (process.env.NODE_ENV === 'production') return res.status(403).json({ error: 'Not allowed in production' })
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { email } = req.body || {}
  if (!email) return res.status(400).json({ error: 'Missing email' })
  try {
    const user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } })
    if (!user) return res.status(404).json({ error: 'User not found' })
    const newPass = 'password123'
    const hashed = await bcrypt.hash(newPass, 10)
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
    return res.status(200).json({ ok: true, message: `Password for ${user.email} reset to '${newPass}' (dev only)` })
  } catch (err) {
    console.error('dev reset-password error', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
