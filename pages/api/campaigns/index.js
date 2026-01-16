import { getPrisma } from '../../../lib/prisma'
const prisma = getPrisma()

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })
  try {
    console.debug('Campaigns: prisma model types:', { campaigns: typeof prisma.campaigns, donation: typeof prisma.donation })
    const campaigns = await prisma.campaigns.findMany({ include: { donations: true } })
    // helper to detect gift-like donations (notes may include 'gift' or similar)
    const isGift = (d) => {
      try {
        const m = String(d.method || '').toLowerCase()
        const n = String(d.notes || '').toLowerCase()
        return /gift/.test(m) || /gift/.test(n)
      } catch (e) { return false }
    }

    const list = campaigns.map(c => {
      const raised = c.donations.reduce((s,d)=>s + (Number(d.amount||0) || 0), 0)
      const giftedRaised = c.donations.filter(isGift).reduce((s,d)=>s + (Number(d.amount||0) || 0), 0)
      // Treat campaigns with funds as implicitly approved for UI display
      const impliedApproved = raised > 0
      return { id: c.id, name: c.name, goal: c.goal, raised, giftedRaised, approved: !!c.approved || impliedApproved }
    })
    return res.status(200).json({ campaigns: list })
  } catch (err) {
    console.error('Campaigns API error', err)
    const details = (err && (err.stack || err.message)) || String(err)
    return res.status(500).json({ error: 'Failed to list campaigns', details: process.env.NODE_ENV === 'production' ? undefined : details })
  }
}
