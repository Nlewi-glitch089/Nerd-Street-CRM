import bcrypt from 'bcryptjs'
import { getUserFromToken } from '../../../lib/auth'
import { getPrisma } from '../../../lib/prisma'

const prisma = getPrisma()

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const auth = req.headers.authorization
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
    const actor = token ? await getUserFromToken(token) : null
    if (!actor) return res.status(401).json({ error: 'Unauthorized' })
    if (actor.role !== 'ADMIN') return res.status(403).json({ error: 'Admin required' })

    const { id, password } = req.body || {}
    if (!id) return res.status(400).json({ error: 'Missing donor id' })
    if (!password) return res.status(400).json({ error: 'Password required' })

    // verify password
    const match = await bcrypt.compare(String(password), actor.password)
    if (!match) return res.status(403).json({ error: 'Invalid password' })

    const now = new Date()
    const updated = await prisma.donor.update({ where: { id: String(id) }, data: { active: false, deletedAt: now, deletedBy: actor.id } })
    try {
      await prisma.actionLog.create({ data: { action: 'delete', targetType: 'donor', targetId: updated.id, userId: actor.id, actorName: actor.name || actor.email || actor.id, meta: { deletedAt: now, email: updated.email, name: `${updated.firstName || ''} ${updated.lastName || ''}` } } })
    } catch (e) {
      console.warn('ActionLog create failed', e)
    }
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('delete-donor error', err)
    return res.status(500).json({ error: 'Server error', details: String(err) })
  }
}
