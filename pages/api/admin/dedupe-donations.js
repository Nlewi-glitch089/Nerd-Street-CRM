import { getUserFromToken } from '../../../lib/auth'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

let prisma
if (!global.__prisma) global.__prisma = new PrismaClient()
prisma = global.__prisma

// POST body: { password, mode: 'preview'|'remove', limit?: number }
// - preview: returns list of duplicate groups (same logic as audit)
// - remove: will delete duplicates, keeping a single donation per group (keeps lowest id)
// Requires admin token + password

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers.authorization || ''
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing authorization token' })

  const actor = await getUserFromToken(token)
  if (!actor) return res.status(401).json({ error: 'Invalid or expired token' })
  if (actor.role !== 'ADMIN') return res.status(403).json({ error: 'Admin role required' })

  const { password, mode, limit } = req.body || {}
  if (!password) return res.status(400).json({ error: 'Password required' })
  const ok = await bcrypt.compare(String(password), actor.password)
  if (!ok) return res.status(403).json({ error: 'Password incorrect' })
  const safeMode = (mode === 'remove') ? 'remove' : 'preview'

  try {
    const all = await prisma.donation.findMany({ select: { id: true, donorId: true, campaignId: true, amount: true, date: true } })
    const groups = {}
    for (const d of all) {
      const dateKey = d.date ? (new Date(d.date)).toISOString().slice(0,10) : 'null'
      const key = `${d.donorId || 'null'}::${d.campaignId || 'null'}::${Number(d.amount||0)}::${dateKey}`
      groups[key] = groups[key] || { key, donorId: d.donorId, campaignId: d.campaignId, amount: Number(d.amount||0), date: dateKey, ids: [] }
      groups[key].ids.push(d.id)
    }

    const duplicates = Object.values(groups).filter(g => g.ids.length > 1)
    if (typeof limit === 'number') duplicates.splice(limit)

    if (safeMode === 'preview') {
      return res.status(200).json({ ok: true, mode: 'preview', duplicateGroupsCount: duplicates.length, duplicateGroups: duplicates.map(g=>({ ...g, count: g.ids.length })) })
    }

    // remove duplicates: keep smallest id per group
    const removed = []
    for (const g of duplicates) {
      const ids = g.ids.map(x=>String(x)).sort()
      const keep = ids[0]
      const toDelete = ids.slice(1)
      if (toDelete.length === 0) continue
      const del = await prisma.donation.deleteMany({ where: { id: { in: toDelete } } })
      removed.push({ key: g.key, kept: keep, removedCount: del.count || 0, removedIds: toDelete })
    }

    return res.status(200).json({ ok: true, mode: 'remove', removedCount: removed.reduce((s,r)=>s + (r.removedCount||0), 0), removed })
  } catch (err) {
    console.error('Dedupe donations error', err)
    return res.status(500).json({ error: 'Dedupe failed', details: String(err) })
  }
}
