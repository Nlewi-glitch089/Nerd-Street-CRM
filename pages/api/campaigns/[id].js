import { getUserFromToken } from '../../../lib/auth'
import { PrismaClient } from '@prisma/client'

const prisma = global.__prisma || new PrismaClient()
if (!global.__prisma) global.__prisma = prisma

export default async function handler(req, res) {
  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Missing campaign id' })

  try {
    if (req.method === 'GET') {
      const c = await prisma.campaigns.findUnique({
        where: { id: String(id) },
        select: { id: true, name: true, goal: true, approved: true, active: true, donations: { select: { id: true, amount: true, date: true, donorId: true, method: true, notes: true } } }
      })
      if (!c) return res.status(404).json({ error: 'Campaign not found' })
      const raised = (c.donations || []).reduce((s,d)=> s + (Number(d.amount||0)||0), 0)
      const giftedRaised = (c.donations || []).filter(d=>{ try{ const m=String(d.method||'').toLowerCase(); const n=String(d.notes||'').toLowerCase(); return /gift/.test(m)||/gift/.test(n) }catch(e){return false} }).reduce((s,d)=> s + (Number(d.amount||0)||0), 0)
      return res.status(200).json({ campaign: { id: c.id, name: c.name, goal: c.goal, startAt: null, endAt: null, raised, giftedRaised, approved: !!c.approved, active: c.active } })
    }

    // require admin for updates and deletes
    const auth = req.headers.authorization || ''
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
    const actor = token ? await getUserFromToken(token) : null
    if (!actor) return res.status(401).json({ error: 'Unauthorized' })
    if (req.method === 'PUT') {
      if (actor.role !== 'ADMIN') return res.status(403).json({ error: 'Admin required' })
      const { name, goal, approved, startAt, endAt } = req.body || {}
      const data = {}
      if (name != null) data.name = name
      if (goal != null) data.goal = Number(goal)
      if (approved != null) data.approved = !!approved
      if (startAt !== undefined) data.startAt = startAt ? new Date(startAt) : null
      if (endAt !== undefined) data.endAt = endAt ? new Date(endAt) : null
      const updated = await prisma.campaigns.update({ where: { id: String(id) }, data })
      try { await prisma.actionLog.create({ data: { action: 'update', targetType: 'campaign', targetId: updated.id, userId: actor.id, actorName: actor.name || actor.email || actor.id, meta: data } }) } catch (e) {}
      return res.status(200).json({ campaign: { id: updated.id, name: updated.name, goal: updated.goal, approved: updated.approved } })
    }

    if (req.method === 'DELETE') {
      if (actor.role !== 'ADMIN') return res.status(403).json({ error: 'Admin required' })
      // soft-delete
      const now = new Date()
      const updated = await prisma.campaigns.update({ where: { id: String(id) }, data: { active: false, deletedAt: now, deletedBy: actor.id } })
      try { await prisma.actionLog.create({ data: { action: 'delete', targetType: 'campaign', targetId: updated.id, userId: actor.id, actorName: actor.name || actor.email || actor.id, meta: { deletedAt: now } } }) } catch (e) {}
      return res.status(200).json({ ok: true })
    }

    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('Campaign detail error', err)
    return res.status(500).json({ error: 'Server error', details: String(err) })
  }
}
