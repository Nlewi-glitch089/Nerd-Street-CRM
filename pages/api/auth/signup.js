import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

// create a singleton Prisma client in dev to avoid hot-reload connection issues
let prisma
if (!global.__prisma) {
  global.__prisma = new PrismaClient()
}
prisma = global.__prisma

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  const { name, email, password, role } = req.body || {}
  if (!name || !email || !password) return res.status(400).json({ error: 'Missing name, email or password' })

  // basic validation
  const emailNorm = String(email || '').trim().toLowerCase()
  const passwordStr = String(password || '')
  // require corporate domain
  const allowedDomain = '@nerdstgamers.com'
  const localPartPattern = /^[a-z0-9._-]+$/
  if (!emailNorm.endsWith(allowedDomain) || !localPartPattern.test(emailNorm.slice(0, -allowedDomain.length))) {
    return res.status(400).json({ error: `Email must be like name${allowedDomain} (only letters, numbers, dot, underscore or hyphen in the local part)` })
  }
  if (passwordStr.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }
  // Do NOT allow clients to create ADMIN accounts via signup.
  // All signups are created as TEAM_MEMBER. Admins must be created/managed by existing admins.
  const roleNorm = 'TEAM_MEMBER'

  try {
    // split name into first/last
    const [firstName, ...rest] = name.trim().split(' ')
    const lastName = rest.length ? rest.join(' ') : null

    // hash password before storing
    const hashed = await bcrypt.hash(passwordStr, 10)
    const user = await prisma.user.create({
      data: {
        name: String(name).trim(),
        email: emailNorm,
        password: hashed,
        role: roleNorm
      }
    })

    return res.status(201).json({ ok: true, id: user.id })
  } catch (err) {
    // Prisma unique constraint error handling
    const message = err?.meta?.target ? `A record already exists for: ${err.meta.target}` : err.message
    return res.status(500).json({ error: message })
  }
}
