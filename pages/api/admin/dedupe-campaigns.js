import { getUserFromToken } from '../../../lib/auth'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

let prisma
if (!global.__prisma) global.__prisma = new PrismaClient()
prisma = global.__prisma

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers.authorization || ''
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing authorization token' })

  const actor = await getUserFromToken(token)
  if (!actor) return res.status(401).json({ error: 'Invalid or expired token' })
  if (actor.role !== 'ADMIN') return res.status(403).json({ error: 'Admin role required' })

  const { password } = req.body || {}
  if (!password) return res.status(400).json({ error: 'Password required' })
  const ok = await bcrypt.compare(String(password), actor.password)
  if (!ok) return res.status(403).json({ error: 'Password incorrect' })

  try {
    const campaigns = await prisma.campaign.findMany({ include: { donations: true } })
    const groups = campaigns.reduce((acc, c) => { acc[c.name] = acc[c.name] || []; acc[c.name].push(c); return acc }, {})
    const summary = []
    for (const name of Object.keys(groups)) {
      const group = groups[name]
      if (group.length <= 1) continue
      // choose keeper: smallest id (stable)
      group.sort((a,b) => (a.id < b.id ? -1 : 1))
      const keeper = group[0]
      const removed = group.slice(1)
      let movedDonations = 0
      for (const dup of removed) {
        // move donations to keeper
        const upd = await prisma.donation.updateMany({ where: { campaignId: dup.id }, data: { campaignId: keeper.id } })
        movedDonations += upd.count || 0
        // delete duplicate campaign
        await prisma.campaign.delete({ where: { id: dup.id } })
      }
      summary.push({ name, keptId: keeper.id, removedIds: removed.map(r=>r.id), movedDonations })
    }

    return res.status(200).json({ ok: true, summary })
  } catch (err) {
    console.error('Dedupe campaigns error', err)
    return res.status(500).json({ error: 'Dedupe failed', details: String(err) })
  }
}
