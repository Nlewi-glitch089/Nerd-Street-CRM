import { getPrisma } from '../../../../lib/prisma'
import { getUserFromToken } from '../../../../lib/auth'

const prisma = getPrisma()

export default async function handler(req, res) {
  const { id } = req.query
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers?.authorization || req.headers?.Authorization || ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing authorization token' })
  const actor = await getUserFromToken(token)
  if (!actor) return res.status(401).json({ error: 'Invalid token' })
  if (actor.role !== 'ADMIN') return res.status(403).json({ error: 'Admin required' })

  const { active } = req.body || {}
  if (typeof active !== 'boolean') return res.status(400).json({ error: 'Invalid payload' })

  try {
    const data = {}
    if (active) {
      data.active = true
      data.deactivatedAt = null
      data.deactivatedBy = null
    } else {
      data.active = false
      data.deactivatedAt = new Date()
      data.deactivatedBy = actor.id
    }
    const user = await prisma.user.update({ where: { id }, data, select: { id: true, name: true, email: true, role: true, active: true, deactivatedAt: true, deactivatedBy: true } })
    return res.status(200).json({ ok: true, user })
  } catch (err) {
    console.error('Deactivate user error', err)
    return res.status(500).json({ error: 'Failed to update user' })
  }
}
