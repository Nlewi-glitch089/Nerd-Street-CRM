import { getUserFromToken } from '../../../lib/auth'
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

let prisma
if (!global.__prisma) global.__prisma = new PrismaClient()
prisma = global.__prisma

// Admin-only: replace campaigns with provided definitions.
// Body: { password, campaigns: [{ name, goal, donationsAmount, inKindAmount }] }
// Behavior: for each entry, delete any campaigns with that name, create a fresh campaign,
// upsert a seed donor for that campaign, and create donation rows to represent donationsAmount and inKindAmount.
// Requires admin token + password.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const auth = req.headers.authorization || ''
  const token = auth && auth.startsWith('Bearer ') ? auth.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Missing authorization token' })

  const actor = await getUserFromToken(token)
  if (!actor) return res.status(401).json({ error: 'Invalid or expired token' })
  if (actor.role !== 'ADMIN') return res.status(403).json({ error: 'Admin role required' })

  const { password, campaigns } = req.body || {}
  if (!password) return res.status(400).json({ error: 'Password required' })
  const ok = await bcrypt.compare(String(password), actor.password)
  if (!ok) return res.status(403).json({ error: 'Password incorrect' })
  if (!Array.isArray(campaigns)) return res.status(400).json({ error: 'campaigns array required' })

  const results = []
  try {
    for (const c of campaigns) {
      const name = String(c.name || '').trim()
      const goal = Number(c.goal || 0) || 0
      const donationsAmount = Number(c.donationsAmount || 0) || 0
      const inKindAmount = Number(c.inKindAmount || 0) || 0

      if (!name) { results.push({ name, error: 'Invalid name' }); continue }

      // Delete existing campaigns with this name (donations deleted via cascade or manually)
      try {
        const existing = await prisma.campaigns.findMany({ where: { name } })
        for (const ex of existing) {
          // delete donations first
          await prisma.donation.deleteMany({ where: { campaignId: ex.id } })
          await prisma.campaigns.delete({ where: { id: ex.id } })
        }
      } catch (e) {
        console.warn('Failed to remove existing campaigns for', name, e)
      }

      // create campaign
      const created = await prisma.campaigns.create({ data: { name, goal, approved: (donationsAmount + inKindAmount) > 0 } })

      // create/upsert a seed donor for this campaign to attribute donations
      const donorEmail = `seed+${created.id}@example.com`
      const donor = await prisma.donor.upsert({ where: { email: donorEmail }, update: {}, create: { firstName: 'Seed', lastName: `${created.id}`, email: donorEmail, totalGiving: 0 } })

      let createdDonations = []
      // create a donations record for donationsAmount (as CARD)
      if (donationsAmount > 0) {
        const d = await prisma.donation.create({ data: { donorId: donor.id, amount: donationsAmount, campaignId: created.id, date: new Date(), method: 'CARD', notes: 'Seeded donation' } })
        createdDonations.push(d)
      }
      // create a donation record for in-kind (method 'IN_KIND')
      if (inKindAmount > 0) {
        const k = await prisma.donation.create({ data: { donorId: donor.id, amount: inKindAmount, campaignId: created.id, date: new Date(), method: 'IN_KIND', notes: 'Seeded in-kind gift' } })
        createdDonations.push(k)
      }

      // update donor aggregates
      try {
        const agg = await prisma.donation.aggregate({ where: { donorId: donor.id }, _sum: { amount: true }, _max: { date: true } })
        await prisma.donor.update({ where: { id: donor.id }, data: { totalGiving: agg._sum.amount || 0, lastGiftAt: agg._max.date || null } })
      } catch (e) { console.warn('Failed to update donor agg', e) }

      results.push({ name, campaignId: created.id, donationsCreated: createdDonations.length, donations: createdDonations.map(d=> ({ id: d.id, amount: d.amount, method: d.method })) })
    }

    return res.status(200).json({ ok: true, results })
  } catch (err) {
    console.error('Replace campaigns error', err)
    return res.status(500).json({ error: 'Replace failed', details: String(err) })
  }
}
