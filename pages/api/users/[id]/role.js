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

  const { role } = req.body || {}
  if (!role || !['ADMIN','TEAM_MEMBER'].includes(role)) return res.status(400).json({ error: 'Invalid role' })

  try {
    const user = await prisma.user.update({ where: { id }, data: { role } , select: { id: true, name: true, email: true, role: true }})
    return res.status(200).json({ ok: true, user })
  } catch (err) {
    console.error('Update role error', err)
    return res.status(500).json({ error: 'Failed to update role' })
  }
}
