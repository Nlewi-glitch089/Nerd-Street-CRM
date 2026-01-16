import { PrismaClient } from '@prisma/client'

let prisma
if (!global.__prisma) {
  global.__prisma = new PrismaClient()
}
prisma = global.__prisma

// Read-only debug endpoint to inspect campaign/donation aggregates.
// Accessible when NODE_ENV !== 'production' OR when the request provides
// header `x-debug-key` that matches process.env.DEBUG_KEY. This avoids
// exposing DB internals accidentally in public deployments.
export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const allowInProd = (() => {
    try {
      if (process.env.NODE_ENV !== 'production') return true
      const provided = req.headers['x-debug-key'] || req.headers['x-debug-key'.toUpperCase()]
      if (process.env.DEBUG_KEY && provided && String(provided) === String(process.env.DEBUG_KEY)) return true
      return false
    } catch (e) { return false }
  })()

  if (!allowInProd) return res.status(403).json({ error: 'Debug endpoint disabled in production (missing DEBUG_KEY)' })

  try {
    // basic aggregates
    const campaignCount = await prisma.campaigns.count()
    const campaigns = await prisma.campaigns.findMany({ include: { donations: true } })

    const campaignStats = campaigns.map(c => {
      const raised = Array.isArray(c.donations) ? c.donations.reduce((s, d) => s + (Number(d.amount || 0) || 0), 0) : 0
      return { id: c.id, name: c.name, goal: c.goal, raised, donations: (c.donations || []).length }
    })

    const donations = await prisma.donation.findMany({ take: 1000 })
    const totalRevenue = donations.reduce((s, d) => s + (Number(d.amount || 0) || 0), 0)
    const donationCount = await prisma.donation.count()

    const donors = await prisma.donor.findMany({ include: { donations: true }, take: 500 })
    const donorCount = await prisma.donor.count()

    return res.status(200).json({ ok: true, campaignCount, donationCount, donorCount, totalRevenue, campaignStats, sampleDonations: donations.slice(0, 50), sampleDonors: donors.slice(0, 50) })
  } catch (err) {
    console.error('Dev campaign-stats error', err)
    return res.status(500).json({ error: 'Failed to gather stats', details: String(err && err.message ? err.message : err) })
  }
}
