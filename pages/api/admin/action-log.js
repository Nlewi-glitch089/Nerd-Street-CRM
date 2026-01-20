import { getUserFromToken } from '../../../lib/auth'
import { getPrisma } from '../../../lib/prisma'

const prisma = getPrisma()

export default async function handler(req, res) {
  try {
    const auth = req.headers.authorization
    const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
    const actor = token ? await getUserFromToken(token) : null
    if (!actor) return res.status(401).json({ error: 'Unauthorized' })
    if (actor.role !== 'ADMIN') return res.status(403).json({ error: 'Admin required' })

    if (req.method === 'GET') {
      const limit = Math.min(100, Number(req.query.limit || 20))
      const logs = await prisma.actionLog.findMany({ orderBy: { createdAt: 'desc' }, take: limit })
      // attach simple user info
      const userIds = Array.from(new Set(logs.map(l => l.userId).filter(Boolean)))
      const users = userIds.length ? await prisma.user.findMany({ where: { id: { in: userIds } } }) : []
      const userMap = users.reduce((acc,u)=>{ acc[u.id] = { id: u.id, name: u.name, email: u.email }; return acc }, {})
      // attempt to enrich target display name when meta lacks it
      const out = []
      for (const l of logs) {
        let targetName = null
        try {
          if ((!l.meta || !(l.meta.name || l.meta.title)) && l.targetType) {
            const t = String(l.targetType).toLowerCase()
            if (t === 'campaign') {
              const c = await prisma.campaigns.findUnique({ where: { id: String(l.targetId) } })
              if (c) targetName = c.name
            } else if (t === 'donor') {
              const d = await prisma.donor.findUnique({ where: { id: String(l.targetId) } })
              if (d) targetName = `${d.firstName || ''} ${d.lastName || ''}`.trim() || d.email || d.id
            } else if (t === 'event') {
              const e = await prisma.event.findUnique({ where: { id: String(l.targetId) } })
              if (e) targetName = e.title
            } else if (t === 'user') {
              const u = await prisma.user.findUnique({ where: { id: String(l.targetId) } })
              if (u) targetName = u.name || u.email || u.id
            }
          }
        } catch (e) {
          console.warn('Failed to enrich action log target name', e)
        }
        out.push({ id: l.id, action: l.action, targetType: l.targetType, targetId: l.targetId, targetName, user: l.userId ? userMap[l.userId] || { id: l.userId } : null, meta: l.meta || null, createdAt: l.createdAt })
      }
      return res.status(200).json({ logs: out })
    }
    return res.status(405).json({ error: 'Method not allowed' })
  } catch (err) {
    console.error('action-log error', err)
    return res.status(500).json({ error: 'Server error', details: String(err) })
  }
}
