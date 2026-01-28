import { getUserFromToken } from '../../../lib/auth'
import { getPrisma } from '../../../lib/prisma'

const prisma = getPrisma()

export default async function handler(req, res) {
  try {
    if (req.method === 'GET') {
      const events = await prisma.event.findMany({ orderBy: { startAt: 'desc' } })
      return res.status(200).json({ events })
    }

    // create event (ADMIN only)
    if (req.method === 'POST') {
      const auth = req.headers.authorization || ''
      const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
      const actor = token ? await getUserFromToken(token) : null
      if (!actor) return res.status(401).json({ error: 'Unauthorized' })
      if (actor.role !== 'ADMIN') return res.status(403).json({ error: 'Admin required' })
      const { title, description, startAt, endAt, location } = req.body || {}
      if (!title) return res.status(400).json({ error: 'title required' })
      const created = await prisma.event.create({ data: { title, description, startAt: startAt ? new Date(startAt) : null, endAt: endAt ? new Date(endAt) : null, location } })
      try { await prisma.actionLog.create({ data: { action: 'create', targetType: 'event', targetId: created.id, userId: actor.id, actorName: actor.name || actor.email || actor.id, meta: { title } } }) } catch (e) {}
      return res.status(201).json({ event: created })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Events API error', err)
    return res.status(500).json({ error: 'Server error', details: String(err) })
  }
}
