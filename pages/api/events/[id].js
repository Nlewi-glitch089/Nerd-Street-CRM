import { getUserFromToken } from '../../../lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = global.__prisma || new PrismaClient()
if (!global.__prisma) global.__prisma = prisma

export default async function handler(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Missing event id' })
  try {
    if (req.method === 'GET') {
      const e = await prisma.event.findUnique({ where: { id: String(id) } })
      if (!e) return res.status(404).json({ error: 'Event not found' })
      return res.status(200).json({ event: e })
    }

    const auth = req.headers.authorization || ''
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
    const actor = token ? await getUserFromToken(token) : null
    if (!actor) return res.status(401).json({ error: 'Unauthorized' })

    if (req.method === 'PUT') {
      if (actor.role !== 'ADMIN') return res.status(403).json({ error: 'Admin required' })
      const { title, description, startAt, endAt, location, active } = req.body || {}
      const data = {}
      if (title != null) data.title = title
      if (description != null) data.description = description
      if (startAt != null) data.startAt = startAt ? new Date(startAt) : null
      if (endAt != null) data.endAt = endAt ? new Date(endAt) : null
      if (location != null) data.location = location
      if (active != null) data.active = !!active
      const updated = await prisma.event.update({ where: { id: String(id) }, data })
      try { await prisma.actionLog.create({ data: { action: 'update', targetType: 'event', targetId: updated.id, userId: actor.id, actorName: actor.name || actor.email || actor.id, meta: data } }) } catch (e) {}
      return res.status(200).json({ event: updated })
    }

    if (req.method === 'DELETE') {
      if (actor.role !== 'ADMIN') return res.status(403).json({ error: 'Admin required' })
      const now = new Date()
      const updated = await prisma.event.update({ where: { id: String(id) }, data: { active: false, deletedAt: now, deletedBy: actor.id } })
      try { await prisma.actionLog.create({ data: { action: 'delete', targetType: 'event', targetId: updated.id, userId: actor.id, actorName: actor.name || actor.email || actor.id, meta: { deletedAt: now } } }) } catch (e) {}
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Event detail error', err)
    return res.status(500).json({ error: 'Server error', details: String(err) })
  }
}
