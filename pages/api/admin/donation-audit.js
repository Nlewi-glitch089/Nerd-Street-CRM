import { getUserFromToken } from '../../../lib/auth'
import { PrismaClient } from '@prisma/client'

let prisma
if (!global.__prisma) global.__prisma = new PrismaClient()
prisma = global.__prisma

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers.authorization || ''
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing authorization token' })

  const actor = await getUserFromToken(token)
  if (!actor) return res.status(401).json({ error: 'Invalid or expired token' })
  if (actor.role !== 'ADMIN') return res.status(403).json({ error: 'Admin role required' })

  try {
    const totalDonations = await prisma.donation.count()
    const all = await prisma.donation.findMany({ select: { id: true, donorId: true, campaignId: true, amount: true, date: true, method: true, notes: true } })
    const totalRevenue = all.reduce((s,d) => s + (Number(d.amount || 0) || 0), 0)

    // detect duplicate groups by donorId + campaignId + amount + date (date truncated to ISO date)
    const groups = {}
    for (const d of all) {
      const dateKey = d.date ? (new Date(d.date)).toISOString().slice(0,10) : 'null'
      const key = `${d.donorId || 'null'}::${d.campaignId || 'null'}::${Number(d.amount||0)}::${dateKey}`
      groups[key] = groups[key] || { key, donorId: d.donorId, campaignId: d.campaignId, amount: Number(d.amount||0), date: dateKey, ids: [] }
      groups[key].ids.push(d.id)
    }

    const duplicates = Object.values(groups).filter(g => g.ids.length > 1).map(g => ({ ...g, count: g.ids.length }))

    // also compute per-campaign totals
    const campaignAgg = {}
    for (const d of all) {
      const cid = String(d.campaignId || 'null')
      campaignAgg[cid] = campaignAgg[cid] || { campaignId: d.campaignId, total: 0, count: 0 }
      campaignAgg[cid].total += Number(d.amount || 0) || 0
      campaignAgg[cid].count += 1
    }

    return res.status(200).json({ totalDonations, totalRevenue, donationCount: all.length, duplicateGroupsCount: duplicates.length, duplicateGroups: duplicates.slice(0,50), campaignAgg: Object.values(campaignAgg) })
  } catch (err) {
    console.error('Donation audit error', err)
    return res.status(500).json({ error: 'Audit failed', details: String(err) })
  }
}
