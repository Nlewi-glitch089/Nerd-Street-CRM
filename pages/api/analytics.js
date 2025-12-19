import { PrismaClient } from '@prisma/client'

let prisma
if (!global.__prisma) {
  global.__prisma = new PrismaClient()
}
prisma = global.__prisma

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    const totalDonors = await prisma.donor.count()
    const totalDonations = await prisma.donation.findMany()
    const totalRevenue = totalDonations.reduce((s,d)=>s + (Number(d.amount||0) || 0), 0)

    // helper to detect gift-like donations (notes may include 'gift')
    const isGift = (d) => {
      try {
        const m = String(d.method || '').toLowerCase()
        const n = String(d.notes || '').toLowerCase()
        return /gift/.test(m) || /gift/.test(n)
      } catch (e) { return false }
    }

    // per-campaign totals
    const campaigns = await prisma.campaigns.findMany({ include: { donations: true } })
    const campaignStats = campaigns.map(c => {
      const raised = c.donations.reduce((s,d)=>s + (Number(d.amount||0) || 0), 0)
      const gifted = c.donations.filter(isGift).reduce((s,d)=>s + (Number(d.amount||0) || 0), 0)
      return { id: c.id, name: c.name, goal: c.goal, raised, gifted }
    })

    // per-donor totals and frequency
    const donors = await prisma.donor.findMany({ include: { donations: true } })
    const donorStats = donors.map(d => {
      const totalGiving = d.donations.reduce((s,x)=>s + (Number(x.amount||0) || 0), 0)
      const giftedTotal = d.donations.filter(isGift).reduce((s,x)=>s + (Number(x.amount||0) || 0), 0)
      return { id: d.id, name: `${d.firstName} ${d.lastName||''}`.trim(), email: d.email, totalGiving, giftedTotal, gifts: d.donations.length, lastGiftAt: d.lastGiftAt }
    })

    return res.status(200).json({ totalDonors, totalRevenue, campaignStats, donorStats })
  } catch (err) {
    console.error('Analytics API error', err)
    return res.status(500).json({ error: 'Failed to compute analytics' })
  }
}
