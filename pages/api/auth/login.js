import { signToken } from '../../../lib/auth'
import bcrypt from 'bcryptjs'
import { getPrisma } from '../../../lib/prisma'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { email, password } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'Missing email or password' })
  const emailNorm = String(email || '').trim().toLowerCase()

  try {
    // normalize email to match how users are stored at signup
    const prisma = getPrisma()
    let user = await prisma.user.findUnique({ where: { email: emailNorm } })
    if (!user) {
      // Attempt a case-insensitive lookup to support legacy accounts
      try {
        user = await prisma.user.findFirst({ where: { email: { equals: emailNorm, mode: 'insensitive' } } })
        if (user) console.warn('Login: matched user with case-insensitive email lookup for', emailNorm)
      } catch (e) {
        // Some Prisma adapters or older versions may not support `mode: 'insensitive'`.
        // Fall back to a broader contains search as a last resort (non-exact).
        try {
          user = await prisma.user.findFirst({ where: { email: { contains: emailNorm } } })
          if (user) console.warn('Login: matched user using fallback contains lookup for', emailNorm)
        } catch (e2) {
          // ignore and proceed to invalid credentials response
        }
      }
    }
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })
    const stored = String(user.password || '')
    let ok = false
    // if stored password looks like a bcrypt hash, compare with bcrypt
    if (/^\$2[aby]\$/.test(stored)) {
      ok = await bcrypt.compare(password, stored)
    } else {
      // legacy plaintext password - compare directly
      if (stored === password) {
        ok = true
        // re-hash and update the stored password so future logins use bcrypt
        try {
          const hashed = await bcrypt.hash(password, 10)
          await prisma.user.update({ where: { id: user.id }, data: { password: hashed } })
        } catch (e) {
          console.warn('Failed to re-hash legacy password for', user.email, e)
        }
      }
    }
    if (!ok) {
      console.warn('Login failed for', emailNorm)
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = signToken({ userId: user.id, email: user.email })
    return res.status(201).json({ ok: true, token, user: { id: user.id, email: user.email, name: user.name, role: user.role } })
  } catch (err) {
    console.error('login handler error', err)
    return res.status(500).json({ error: (err && err.message) || String(err) })
  }
}
